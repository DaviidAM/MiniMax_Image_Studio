async function urlToBlob(href: string): Promise<Blob> {
  const resp = await fetch(href);
  if (!resp.ok) throw new Error("Failed to fetch image: " + resp.status);
  return resp.blob();
}

export async function downloadImage(src: string, _prompt: string): Promise<void> {
  const timestamp = Date.now();
  if (src.startsWith("data:")) {
    const mime = src.split(";")[0].replace("data:", "") || "image/jpeg";
    const b64 = src.split(",")[1];
    const binary = atob(b64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const filename = "minimax-" + timestamp + ".jpg";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } else {
    try {
      const blob = await urlToBlob(src);
      const filename = "minimax-" + timestamp + ".jpg";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      window.open(src, "_blank", "noopener");
    }
  }
}
