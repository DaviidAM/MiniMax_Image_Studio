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

  console.log("[api] generateImages called, references.length:", references.length);
  for (let i = 0; i < references.length; i++) {
    const f = references[i];
    console.log(`[api] references[${i}]: name=${f.name}, type=${f.type}, size=${f.size}`);
  }

  // Backend only accepts multipart/form-data. Always use FormData.
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("model", model);
  form.append("aspect_ratio", aspect_ratio);
  form.append("n", String(n));
  if (seed !== undefined) {
    form.append("seed", String(seed));
  }
  for (const file of references) {
    console.log("[api] appending file to FormData:", file.name, file.type, file.size);
    form.append("reference_images", file);
  }

  const resp = await fetch("/api/generate", { method: "POST", body: form });

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

  // Backend returns image_urls when references provided, image_base64 otherwise.
  // No nested "data" wrapper — fields are at the top level.
  const imageUrls: string[] =
    body.image_urls ??
    (body.image_base64 ?? []).map((b64: string) => `data:image/jpeg;base64,${b64}`);

  return { imageUrls };
}
