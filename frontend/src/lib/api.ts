export interface GenerateOptions {
  prompt: string;
  model?: "image-01" | "image-01-live";
  aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "16:10" | "10:16" | "9:21";
  seed?: number;
  n?: number;
  references?: File[];
}

export interface GenerationResult {
  imageUrls: string[];
}

export async function generateImages(
  opts: GenerateOptions
): Promise<GenerationResult> {
  const { prompt, model = "image-01", aspect_ratio = "16:9", seed, n = 1, references = [] } = opts;

  const hasReferences = references.length > 0;

  let resp: Response;

  if (hasReferences) {
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("model", model);
    form.append("aspect_ratio", aspect_ratio);
    form.append("n", String(n));
    if (seed !== undefined) {
      form.append("seed", String(seed));
    }
    for (const file of references) {
      form.append("reference_images", file);
    }

    resp = await fetch("/api/generate", { method: "POST", body: form });
  } else {
    const payload: Record<string, unknown> = {
      model,
      prompt,
      aspect_ratio,
      n,
      response_format: "url",
    };
    if (seed !== undefined) {
      payload.seed = seed;
    }

    resp = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const body = await resp.json();
      msg = body.detail ?? msg;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }

  const body = await resp.json();
  const data = body.data ?? {};

  // API returns image_urls when references provided, image_base64 otherwise
  const imageUrls: string[] =
    data.image_urls ??
    (data.image_base64 ?? []).map((b64: string) => `data:image/jpeg;base64,${b64}`);

  return { imageUrls };
}
