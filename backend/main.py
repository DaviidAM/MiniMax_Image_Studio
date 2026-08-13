"""
FastAPI backend for MiniMax Image Studio.

POST /generate  — text-to-image or img2img via MiniMax image-01 API
GET  /          — health check
"""
from __future__ import annotations

import base64
import os
import uuid
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="MiniMax Image Studio Backend")

DEFAULT_URL = "https://api.minimax.io/v1/image_generation"
SUPPORTED_ASPECTS = {"1:1", "16:9", "9:16", "4:3", "3:4", "16:10", "10:16", "9:21"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
SUPPORTED_MODELS = ["image-01", "image-01-live"]


def _load_key() -> str:
    key = os.environ.get("MINIMAX_API_KEY")
    if key:
        return key
    env_file = Path.home() / ".hermes" / ".env"
    if env_file.is_file():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("MINIMAX_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("MINIMAX_API_KEY not found in environment or ~/.hermes/.env")


def _read_upload(upload: UploadFile) -> tuple[str, str]:
    """Read an UploadFile, return (mime_type, base64_encoded_content)."""
    suffix = Path(upload.filename or "").suffix.lower()
    if suffix not in IMAGE_EXTS:
        raise HTTPException(400, f"Unsupported image format: {suffix} (use {IMAGE_EXTS})")
    contents = upload.file.read()
    mime = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".webp": "image/webp",
        ".bmp": "image/bmp", ".gif": "image/gif",
    }.get(suffix, "image/jpeg")
    return mime, base64.b64encode(contents).decode("ascii")


@app.get("/")
async def health():
    return {"status": "ok"}


@app.post("/generate")
async def generate(
    prompt: str = Form(..., description="Image prompt"),
    model: str = Form("image-01", description="Model: image-01 or image-01-live"),
    aspect_ratio: str = Form("16:9", description="Aspect ratio"),
    seed: int | None = Form(None, description="Optional seed for reproducibility"),
    n: int = Form(1, ge=1, le=4, description="Number of images (1-4)"),
    reference_weight: float | None = Form(None, ge=0.0, le=1.0, description="Reference weight 0-1"),
    reference_images: list[UploadFile] = File(default=[], description="Optional reference images (img2img mode)"),
):
    """
    Generate images via MiniMax image-01.

    When reference_images are provided the endpoint runs in img2img mode and
    returns image_urls. Otherwise it runs in text-to-image mode and returns
    image_base64 (or image_urls when response_format=url is used internally).
    """
    if model not in SUPPORTED_MODELS:
        raise HTTPException(400, f"model must be one of {SUPPORTED_MODELS}")
    if aspect_ratio not in SUPPORTED_ASPECTS:
        raise HTTPException(400, f"aspect_ratio must be one of {SUPPORTED_ASPECTS}")

    api_key = _load_key()

    # Encode reference images if any
    refs_b64: list[str] = []
    for ref in reference_images:
        try:
            _, b64 = _read_upload(ref)
            refs_b64.append(b64)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(400, str(exc)) from exc

    has_refs = len(refs_b64) > 0
    n = max(1, min(4, n))

    payload: dict = {
        "model": model,
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "n": n,
    }
    if seed is not None:
        payload["seed"] = seed

    if has_refs:
        if len(refs_b64) == 1:
            payload["reference_image"] = refs_b64[0]
        else:
            payload["reference_images"] = refs_b64
        if reference_weight is not None:
            payload["reference_weight"] = max(0.0, min(1.0, reference_weight))
    else:
        payload["response_format"] = "base64"

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post(
                DEFAULT_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(500, f"Minimax API error {exc.response.status_code}: {exc.response.text[:400]}")
    except httpx.TimeoutException:
        raise HTTPException(500, "Minimax API timeout after 180s")
    except Exception as exc:
        raise HTTPException(500, str(exc)) from exc

    body = resp.json()
    data = body.get("data", {})

    image_urls = data.get("image_urls")
    images_b64 = data.get("image_base64")

    if not image_urls and not images_b64:
        raise HTTPException(500, f"Unexpected API response: {str(body)[:400]}")

    result: dict = {"model": model, "aspect_ratio": aspect_ratio, "n": n}

    if has_refs:
        # Fetch image URLs and convert to base64 data URLs to avoid CORS/ expiry issues
        # when the browser loads them as <img src>.
        data_urls: list[str] = []
        for url in (image_urls or []):
            try:
                img_resp = await client.get(url)
                img_resp.raise_for_status()
                b64 = base64.b64encode(img_resp.content).decode("ascii")
                mime = img_resp.headers.get("content-type", "image/jpeg")
                data_urls.append(f"data:{mime};base64,{b64}")
            except Exception:
                # If fetch fails, pass the raw URL as a fallback (browser will handle CORS)
                data_urls.append(url)
        result["image_urls"] = data_urls
    else:
        result["image_base64"] = images_b64 or []

    return result
