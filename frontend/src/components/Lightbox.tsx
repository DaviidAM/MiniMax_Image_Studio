"use client";

import { useEffect, useCallback } from "react";
import { X, Download } from "lucide-react";

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

async function urlToBlob(href: string): Promise<Blob> {
  const resp = await fetch(href);
  if (!resp.ok) throw new Error("Failed to fetch image: " + resp.status);
  return resp.blob();
}

async function downloadImage(src: string, _prompt: string) {
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

export default function Lightbox({ src, alt = "Fullscreen image", onClose }: Props) {
  const handleDownload = useCallback(() => { downloadImage(src, alt); }, [src, alt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="lightbox-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Image lightbox">
      <div className="lightbox-content">
        <button className="lightbox-close" onClick={onClose} aria-label="Close lightbox">
          <X size={20} />
        </button>
        <button className="lightbox-download" onClick={handleDownload} aria-label="Download image">
          <Download size={18} />
          <span>Download</span>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="lightbox-img" />
      </div>
    </div>
  );
}
