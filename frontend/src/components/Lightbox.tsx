"use client";

import { useEffect, useCallback } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { downloadImage } from "@/lib/downloadUtils";

interface Props {
  src: string;
  alt?: string;
  currentIndex: number;
  totalImages: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Lightbox({
  src,
  alt = "Fullscreen image",
  currentIndex,
  totalImages,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const handleDownload = useCallback(() => { downloadImage(src, alt); }, [src, alt]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const showArrows = totalImages > 1;

  return (
    <div className="lightbox-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Image lightbox">
      {showArrows && (
        <>
          <button
            className="lightbox-nav lightbox-nav-prev"
            onClick={onPrev}
            aria-label="Previous image"
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={32} />
          </button>
          <button
            className="lightbox-nav lightbox-nav-next"
            onClick={onNext}
            aria-label="Next image"
            disabled={currentIndex === totalImages - 1}
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

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
