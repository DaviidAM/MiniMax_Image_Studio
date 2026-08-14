"use client";

import { useState } from "react";
import { AlertCircle, ImageOff, X, Maximize2, Trash2, Copy, Check } from "lucide-react";
import type { Generation } from "@/app/page";
import Lightbox from "./Lightbox";

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

function StatusToast({
  status,
  onDismiss,
}: {
  status: Generation["status"];
  onDismiss?: () => void;
}) {
  const isError = status.phase === "error";
  const isSuccess = status.phase === "success";

  if (status.phase === "idle") return null;

  return (
    <div
      className={`status-toast ${
        isError ? "status-toast--error" : isSuccess ? "status-toast--success" : "status-toast--progress"
      }`}
    >
      <div className="status-toast__spinner" />
      <span className="status-toast__message">
        {status.phase === "sending" && "Sending request to backend..."}
        {status.phase === "processing" && "Backend processing image..."}
        {status.phase === "success" && "Image ready!"}
        {isError && status.message}
      </span>
      {isError && onDismiss && (
        <button
          className="status-toast__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X size={14} />
        </button>
      )}
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
    <button
      className="copy-btn"
      onClick={handleCopy}
      aria-label="Copy prompt"
      title="Copy prompt"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function GenerationRow({
  gen,
  index,
  onDismissError,
  onDelete,
  allImageUrls,
  setLightboxIndex,
}: {
  gen: Generation;
  index: number;
  onDismissError: (id: string) => void;
  onDelete: (id: string) => void;
  allImageUrls: string[];
  setLightboxIndex: (idx: number | null) => void;
}) {
  const hasImages = gen.imageUrls.length > 0;
  const hasError = gen.error || gen.status.phase === "error";
  const isLoading = gen.isLoading;
  const timestamp = new Date(gen.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="generation-row">
      {/* ── Header: prompt + metadata + controls ── */}
      <div className="generation-header">
        <div className="generation-meta">
          <span className="generation-index">#{index + 1}</span>
          <span className="generation-timestamp">{timestamp}</span>
          {gen.referenceFiles.length > 0 && (
            <span className="generation-refs">
              · {gen.referenceFiles.length} reference
            </span>
          )}
        </div>
        <div className="generation-controls">
          <button
            className="generation-delete"
            onClick={() => onDelete(gen.id)}
            aria-label="Delete this generation"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Prompt ── */}
      <div className="generation-prompt-row">
        <span className="generation-prompt-text">{gen.prompt}</span>
        <CopyButton text={gen.prompt} />
      </div>

      {/* ── Body: loading / error / images ── */}
      <div className="generation-body">
        {isLoading && <SkeletonCard />}

        {hasError && !isLoading && (
          <div className="error-state">
            <AlertCircle size={28} className="output-state-icon" />
            <p>Generation Failed</p>
            <p>{(gen.status.phase === 'error' && 'message' in gen.status ? gen.status.message : '')}</p>
          </div>
        )}

        {hasImages && !isLoading && (
          <div className={`gallery-grid ${gen.imageUrls.length > 1 ? "multi" : "single"}`}>
            {gen.imageUrls.map((url, i) => (
              <div
                key={i}
                className="gallery-card"
                onClick={() => {
                  // compute global index for lightbox
                  let globalIdx = 0;
                  for (let gi = 0; gi < index; gi++) {
                    globalIdx += allImageUrls.length;
                  }
                  globalIdx += i;
                  setLightboxIndex(globalIdx);
                }}
                role="button"
                tabIndex={0}
                aria-label={`View image ${i + 1} fullscreen`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    let globalIdx = 0;
                    for (let gi = 0; gi < index; gi++) {
                      globalIdx += allImageUrls.length;
                    }
                    globalIdx += i;
                    setLightboxIndex(globalIdx);
                  }
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Generated image ${i + 1}`} />
                <div className="gallery-overlay">
                  <span className="gallery-badge">
                    image-01 · #{i + 1}
                  </span>
                  <div className="gallery-expand-icon">
                    <Maximize2 size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OutputPanel({
  generations,
  onDismissError,
  onDeleteGeneration,
}: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Flatten all imageUrls for lightbox
  const allImageUrls = generations.flatMap((g) => g.imageUrls);

  // Show toast only for the most recent non-idle generation
  const toastGen = generations.find((g) => g.status.phase !== "idle");
  const showToast = !!toastGen;

  if (generations.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div className="output-state">
          <ImageOff size={48} className="output-state-icon" />
          <p>Your generated image(s) will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      {showToast && toastGen && (
        <StatusToast
          status={toastGen.status}
          onDismiss={
            toastGen.status.phase === "error"
              ? () => onDismissError(toastGen.id)
              : undefined
          }
        />
      )}

      {/* Scrollable generations list */}
      <div className="generations-list">
        {generations.map((gen, index) => (
          <GenerationRow
            key={gen.id}
            gen={gen}
            index={index}
            onDismissError={onDismissError}
            onDelete={onDeleteGeneration}
            allImageUrls={gen.imageUrls}
            setLightboxIndex={setLightboxIndex}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && allImageUrls[lightboxIndex] && (
        <Lightbox
          src={allImageUrls[lightboxIndex]}
          alt={`Generated image ${lightboxIndex + 1}`}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
