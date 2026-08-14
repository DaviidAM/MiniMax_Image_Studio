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
# Aspect ratios per MiniMax image-01 official docs (read 2026-08-14).
# Only these 8 values are accepted by the API. Three values we previously had
# (16:10, 10:16, 9:21) are NOT in the docs and would be rejected.
SUPPORTED_ASPECTS = {"1:1", "16:9", "9:16", "4:3", "3:2", "2:3", "3:4", "21:9"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
SUPPORTED_MODELS = ["image-01", "image-01-live"]
MAX_PROMPT_LENGTH = 1500  # MiniMax API hard limit (status_code: 2013 if exceeded)


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
    prompt: str = Form(..., description=f"Image prompt (max {MAX_PROMPT_LENGTH} chars)"),
    model: str = Form("image-01", description="Model: image-01 or image-01-live"),
    aspect_ratio: str = Form("16:9", description="Aspect ratio"),
    seed: int | None = Form(None, description="Optional seed for reproducibility"),
    n: int = Form(1, ge=1, le=4, description="Number of images (1-4)"),
    reference_images: list[UploadFile] = File(default=[], description="Optional reference images (img2img mode)"),
):
    """
    Generate images via MiniMax image-01.

    When reference_images are provided the endpoint runs in img2img mode and
    uses subject_reference[{type, image_file}] (per official MiniMax docs).
    Only ONE reference image is supported per request.
    """
    # Validate inputs
    if model not in SUPPORTED_MODELS:
        raise HTTPException(400, f"model must be one of {SUPPORTED_MODELS}")
    if aspect_ratio not in SUPPORTED_ASPECTS:
        valid = sorted(SUPPORTED_ASPECTS)
        raise HTTPException(400, f"aspect_ratio must be one of {valid}, got '{aspect_ratio}'")
    if not prompt or len(prompt.strip()) == 0:
        raise HTTPException(400, "prompt is required and cannot be empty")
    if len(prompt) > MAX_PROMPT_LENGTH:
        raise HTTPException(
            400,
            f"prompt too long: {len(prompt)} chars, max {MAX_PROMPT_LENGTH}"
        )

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
        # MiniMax API expects subject_reference[] with {type, image_file}
        # type="character" preserves the person's identity in generated images.
        # Only ONE reference is supported per request (API returns 2013 otherwise).
        # NOTE: reference_weight does NOT exist in MiniMax image-01 docs (ignored if sent).
        subject_ref = []
        for b64 in refs_b64[:1]:  # take only the first one (API rejects multiple)
            subject_ref.append({
                "type": "character",
                "image_file": f"data:image/jpeg;base64,{b64}",
            })
        payload["subject_reference"] = subject_ref
        # Force base64 to avoid expiring OSS presigned URLs and CORS issues
        payload["response_format"] = "base64"
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

    image_urls_list = data.get("image_urls") or []
    images_b64_list = data.get("image_base64") or []

    if not image_urls_list and not images_b64_list:
        raise HTTPException(502, f"MiniMax returned no images. Full response: {str(data)[:400]}")

    result: dict = {"model": model, "aspect_ratio": aspect_ratio, "n": n}

    if has_refs:
        # Convert whatever MiniMax returned into inline data URLs / base64 so the
        # browser can load them without CORS or expiring-URL issues.
        data_urls: list[str] = []
        for url in image_urls_list:
            try:
                img_resp = await client.get(url)
                img_resp.raise_for_status()
                b64 = base64.b64encode(img_resp.content).decode("ascii")
                mime = img_resp.headers.get("content-type", "image/jpeg")
                data_urls.append(f"data:{mime};base64,{b64}")
            except Exception:
                # Last-resort fallback: hand back the raw URL even if fetching fails.
                data_urls.append(url)
        # If MiniMax gave us base64 directly, wrap as data URLs.
        for b64 in images_b64_list:
            data_urls.append(f"data:image/jpeg;base64,{b64}")
        result["image_urls"] = data_urls
    else:
        if images_b64_list:
            result["image_base64"] = images_b64_list
        else:
            # No img2img, no refs: txt2img returns image_base64 OR URL format
            result["image_base64"] = [
                url.split(",", 1)[1] if url.startswith("data:") and "," in url else url
                for url in image_urls_list
            ]

    return result
