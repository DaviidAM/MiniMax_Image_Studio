"use client";

import { ImageIcon, AlertCircle, ImageOff } from "lucide-react";

interface Props {
  imageUrls: string[];
  prompt: string;
  referenceFiles: File[];
  error: string | null;
  isLoading: boolean;
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

export default function OutputPanel({ imageUrls, prompt, referenceFiles, error, isLoading }: Props) {
  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Skeleton images */}
        <SkeletonGrid count={1} />
        {/* Prompt bar skeleton */}
        <div className="prompt-bar">
          <div className="spinner" style={{ margin: "0 auto" }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={36} className="output-state-icon" />
        <p>Generation Failed</p>
        <p>{error}</p>
      </div>
    );
  }

  if (imageUrls.length === 0) {
    return (
      <div className="output-state">
        <ImageOff size={48} className="output-state-icon" />
        <p>Your generated image(s) will appear here</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Gallery */}
      <div className={`gallery-grid ${imageUrls.length > 1 ? "multi" : "single"}`}>
        {imageUrls.map((url, i) => (
          <div key={i} className="gallery-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Generated image ${i + 1}`} />
            <div className="gallery-overlay">
              <span className="gallery-badge">image-01 · #{i + 1}</span>
            </div>
          </div>
        ))}
      </div>

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
