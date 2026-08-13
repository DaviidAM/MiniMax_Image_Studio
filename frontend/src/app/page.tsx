"use client";

import { useState } from "react";
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
    <main className="container">
      <div className="panel input-panel">
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
          MiniMax Image Studio
        </h1>
        <div style={{ flex: 1, overflow: "auto" }}>
          <InputPanel onGenerate={handleGenerate} isLoading={isLoading} />
        </div>
      </div>

      <div className="panel output-panel">
        <OutputPanel
          imageUrls={imageUrls}
          prompt={prompt}
          referenceFiles={referenceFiles}
          error={error}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}
