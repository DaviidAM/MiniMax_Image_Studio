"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import InputPanel from "@/components/InputPanel";
import OutputPanel from "@/components/OutputPanel";
import { generateImages } from "@/lib/api";
import type { GenerateOptions } from "@/lib/api";
import "./globals.css";

export type GenerationStatus =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "processing" }
  | { phase: "success" }
  | { phase: "error"; message: string };

export interface Generation {
  id: string;
  imageUrls: string[];
  prompt: string;
  referenceFiles: File[];
  error: string | null;
  isLoading: boolean;
  status: GenerationStatus;
  timestamp: number;
}

export default function Home() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss success toast after 3 seconds
  useEffect(() => {
    const latestGen = generations[0];
    if (latestGen?.status.phase === "success") {
      successTimerRef.current = setTimeout(() => {
        setGenerations((prev) =>
          prev.map((g) =>
            g.id === latestGen.id ? { ...g, status: { phase: "idle" } } : g
          )
        );
      }, 3000);
    }
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generations[0]?.status.phase]);

  const handleGenerate = async (opts: GenerateOptions) => {
    const id = crypto.randomUUID();
    const newGen: Generation = {
      id,
      imageUrls: [],
      prompt: opts.prompt,
      referenceFiles: opts.references ?? [],
      error: null,
      isLoading: true,
      status: { phase: "sending" },
      timestamp: Date.now(),
    };

    // Prepend new generation at top, cap at 10
    setGenerations((prev) => {
      const next = [newGen, ...prev];
      return next.slice(0, 10);
    });

    // Safety net: if anything goes wrong (timeout, network error, etc.),
    // ALWAYS clear the loading state on this generation after 200s.
    const safetyTimeout = setTimeout(() => {
      setGenerations((prev) =>
        prev.map((g) =>
          g.id === id && g.isLoading
            ? {
                ...g,
                isLoading: false,
                error: g.error || "Generation timed out",
                status: g.status.phase === "idle" || g.status.phase === "success"
                  ? g.status
                  : { phase: "error", message: "Generation timed out" },
              }
            : g
        )
      );
    }, 200000);

    try {
      const result = await generateImages(opts);
      clearTimeout(safetyTimeout);
      setGenerations((prev) =>
        prev.map((g) =>
          g.id === id
            ? { ...g, status: { phase: "processing" } }
            : g
        )
      );
      // Small delay so user sees "Backend processing" state
      await new Promise((r) => setTimeout(r, 400));
      setGenerations((prev) =>
        prev.map((g) =>
          g.id === id
            ? { ...g, imageUrls: result.imageUrls, status: { phase: "success" }, isLoading: false }
            : g
        )
      );
    } catch (err) {
      clearTimeout(safetyTimeout);
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setGenerations((prev) =>
        prev.map((g) =>
          g.id === id
            ? { ...g, error: message, status: { phase: "error", message }, isLoading: false }
            : g
        )
      );
    }
  };

  const dismissError = (id: string) => {
    setGenerations((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, status: { phase: "idle" }, error: null } : g
      )
    );
  };

  const deleteGeneration = (id: string) => {
    setGenerations((prev) => prev.filter((g) => g.id !== id));
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
            <InputPanel onGenerate={handleGenerate} isLoading={generations.some((g) => g.isLoading)} />
          </div>
        </aside>

        {/* Right: output */}
        <section className="output-panel">
          <OutputPanel
            generations={generations}
            onDismissError={dismissError}
            onDeleteGeneration={deleteGeneration}
          />
        </section>
      </div>
    </div>
  );
}
