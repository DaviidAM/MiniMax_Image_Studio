"use client";

import { useState } from "react";
import { AlertCircle, ImageOff, X, Maximize2 } from "lucide-react";
import type { GenerationStatus } from "@/app/page";
import Lightbox from "./Lightbox";

interface Props {
  imageUrls: string[];
  prompt: string;
  referenceFiles: File[];
  error: string | null;
  isLoading: boolean;
  status: GenerationStatus;
  onDismissError?: () => void;
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className={`skeleton-grid ${count > 1 ? "multi" : "single"}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton" />
        </div>
      ))}
    </div>
  );
}

function StatusToast({ status, onDismissError }: { status: GenerationStatus; onDismissError?: () => void }) {
  const isError = status.phase === "error";
  const isSuccess = status.phase === "success";

  if (status.phase === "idle") return null;

  return (
    <div className={`status-toast ${isError ? "status-toast--error" : isSuccess ? "status-toast--success" : "status-toast--progress"}`}>
      <div className="status-toast__spinner" />
      <span className="status-toast__message">
        {status.phase === "sending" && "Sending request to backend..."}
        {status.phase === "processing" && "Backend processing image..."}
        {status.phase === "success" && "Image ready!"}
        {isError && status.message}
      </span>
      {isError && onDismissError && (
        <button className="status-toast__dismiss" onClick={onDismissError} aria-label="Dismiss error">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default function OutputPanel({ imageUrls, prompt, referenceFiles, error, isLoading, status, onDismissError }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showStatusToast = status.phase !== "idle";

  if (isLoading && status.phase === "sending") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <StatusToast status={status} onDismissError={onDismissError} />
        <SkeletonGrid count={1} />
        <div className="prompt-bar"><div className="spinner" style={{ margin: "0 auto" }} /></div>
      </div>
    );
  }

  if (isLoading && status.phase === "processing") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <StatusToast status={status} onDismissError={onDismissError} />
        <SkeletonGrid count={1} />
        <div className="prompt-bar"><div className="spinner" style={{ margin: "0 auto" }} /></div>
      </div>
    );
  }

  if (error || status.phase === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {showStatusToast && <StatusToast status={status} onDismissError={onDismissError} />}
        <div className="error-state">
          <AlertCircle size={36} className="output-state-icon" />
          <p>Generation Failed</p>
          <p>{error ?? (status.phase === "error" ? status.message : "")}</p>
        </div>
      </div>
    );
  }

  if (imageUrls.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {showStatusToast && <StatusToast status={status} onDismissError={onDismissError} />}
        <div className="output-state">
          <ImageOff size={48} className="output-state-icon" />
          <p>Your generated image(s) will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {showStatusToast && <StatusToast status={status} onDismissError={onDismissError} />}

      {/* Gallery */}
      <div className={`gallery-grid ${imageUrls.length > 1 ? "multi" : "single"}`}>
        {imageUrls.map((url, i) => (
          <div
            key={i}
            className="gallery-card"
            onClick={() => setLightboxIndex(i)}
            role="button"
            tabIndex={0}
            aria-label={`View image ${i + 1} fullscreen`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setLightboxIndex(i); }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Generated image ${i + 1}`} />
            <div className="gallery-overlay">
              <span className="gallery-badge">image-01 · #{i + 1}</span>
              <div className="gallery-expand-icon">
                <Maximize2 size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          src={imageUrls[lightboxIndex]}
          alt={`Generated image ${lightboxIndex + 1}`}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Prompt + references bar */}
      <div className="prompt-bar">
        <p className="prompt-bar-label">Prompt</p>
        <p className="prompt-bar-text">{prompt}</p>
        {referenceFiles.length > 0 && (
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {referenceFiles.length} reference image{referenceFiles.length > 1 ? "s" : ""} used
          </p>
        )}
      </div>
    </div>
  );
}
