"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, ImageOff, Trash2, Copy, Check, Download } from "lucide-react";
import type { Generation } from "@/app/page";
import Lightbox from "./Lightbox";
import { downloadImage } from "@/lib/downloadUtils";

interface Props {
  generations: Generation[];
  onDismissError: (id: string) => void;
  onDeleteGeneration: (id: string) => void;
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton" />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="copy-btn" onClick={handleCopy} aria-label="Copy prompt" title="Copy prompt">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function OutputPanel({ generations, onDismissError, onDeleteGeneration }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const allImageUrls = generations.flatMap((g) => g.imageUrls);

  // FIX 1: Browser back button
  useEffect(() => {
    if (lightboxIdx !== null) {
      window.history.pushState({ lightboxOpen: true }, "");
    }
    const handlePop = (e: PopStateEvent) => {
      if (lightboxIdx !== null) {
        e.preventDefault();
        setLightboxIdx(null);
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [lightboxIdx]);

  const openLightbox = useCallback((idx: number) => setLightboxIdx(idx), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const goPrev = useCallback(() => setLightboxIdx((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const goNext = useCallback(() => setLightboxIdx((i) => (i !== null && i < allImageUrls.length - 1 ? i + 1 : i)), [allImageUrls.length]);

  if (generations.length === 0) {
    return (
      <div className="output-state">
        <ImageOff size={48} className="output-state-icon" />
        <p>Your generated image(s) will appear here</p>
      </div>
    );
  }

  return (
    <>
      <div className="generations-list">
        {generations.map((gen, index) => {
          const hasImages = gen.imageUrls.length > 0;
          const hasError = gen.error || gen.status.phase === "error";
          const isLoading = gen.isLoading;
          const timestamp = new Date(gen.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

          let globalImgStart = 0;
          for (let gi = 0; gi < index; gi++) {
            globalImgStart += generations[gi].imageUrls.length;
          }

          return (
            <div key={gen.id} className="generation-row">
              <div className="generation-header">
                <div className="generation-meta">
                  <span className="generation-index">#{index + 1}</span>
                  <span className="generation-timestamp">{timestamp}</span>
                  {gen.referenceFiles.length > 0 && (
                    <span className="generation-refs">· {gen.referenceFiles.length} ref</span>
                  )}
                </div>
                <div className="generation-controls">
                  {hasImages && !isLoading && (
                    <button className="generation-download" onClick={() => downloadImage(gen.imageUrls[0], gen.prompt)} aria-label="Download image" title="Download image">
                      <Download size={14} />
                    </button>
                  )}
                  <button className="generation-delete" onClick={() => onDeleteGeneration(gen.id)} aria-label="Delete" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="generation-prompt-row">
                <span className="generation-prompt-text">{gen.prompt}</span>
                <CopyButton text={gen.prompt} />
              </div>

              <div className="generation-body">
                {isLoading && <SkeletonCard />}

                {hasError && !isLoading && (
                  <div className="error-state">
                    <AlertCircle size={28} className="output-state-icon" />
                    <p>Generation Failed</p>
                    <p>{gen.status.phase === "error" && "message" in gen.status ? gen.status.message : gen.error}</p>
                    <button onClick={() => onDismissError(gen.id)} className="error-dismiss-btn">Dismiss</button>
                  </div>
                )}

                {hasImages && !isLoading && (
                  <div className="gallery-grid single">
                    {gen.imageUrls.map((url, i) => (
                      <div key={i} className="gallery-card" onClick={() => openLightbox(globalImgStart + i)} role="button" tabIndex={0} aria-label="View fullscreen" onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openLightbox(globalImgStart + i); }}>
                        <img src={url} alt={"Generated " + (i + 1)} />
                        <div className="gallery-overlay">
                          <span className="gallery-badge">image-01</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && !hasImages && !hasError && (
                  <div className="empty-state"><p>No images generated</p></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lightboxIdx !== null && allImageUrls[lightboxIdx] && (
        <Lightbox
          src={allImageUrls[lightboxIdx]}
          alt={"Generated image " + (lightboxIdx + 1)}
          currentIndex={lightboxIdx}
          totalImages={allImageUrls.length}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </>
  );
}
