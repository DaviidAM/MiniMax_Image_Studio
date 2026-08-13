"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import InputPanel from "@/components/InputPanel";
import OutputPanel from "@/components/OutputPanel";
import { generateImages } from "@/lib/api";
import type { GenerateOptions } from "@/lib/api";
import "./globals.css";

export default function Home() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (opts: GenerateOptions) => {
    setIsLoading(true);
    setError(null);
    setPrompt(opts.prompt);
    setReferenceFiles(opts.references ?? []);
    setImageUrls([]);

    try {
      const result = await generateImages(opts);
      setImageUrls(result.imageUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      {/* ── Top bar ────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon">
            <Sparkles size={16} color="#fff" />
          </div>
          <span className="brand-name">MiniMax Image Studio</span>
          <span className="topbar-subtitle">AI Image Generation</span>
        </div>
        <div className="topbar-credits">
          Powered by MiniMax image-01
        </div>
      </header>

      {/* ── 2-column body ───────────────────────────────── */}
      <div className="layout-body">
        {/* Left: input */}
        <aside className="input-panel">
          <div className="input-panel-header">
            <h1>Create Image</h1>
          </div>
          <div className="input-panel-body">
            <InputPanel onGenerate={handleGenerate} isLoading={isLoading} />
          </div>
        </aside>

        {/* Right: output */}
        <section className="output-panel">
          <OutputPanel
            imageUrls={imageUrls}
            prompt={prompt}
            referenceFiles={referenceFiles}
            error={error}
            isLoading={isLoading}
          />
        </section>
      </div>
    </div>
  );
}
