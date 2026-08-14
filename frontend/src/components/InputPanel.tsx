"use client";

import { useCallback, useRef, useState } from "react";
import {
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import type { GenerateOptions } from "@/lib/api";

const ASPECT_OPTIONS = ["1:1", "16:9", "9:16", "4:3", "3:4", "16:10", "10:16", "9:21"] as const;
const MODEL_OPTIONS = ["image-01", "image-01-live"] as const;

interface Props {
  onGenerate: (opts: GenerateOptions) => void;
  isLoading: boolean;
}

export default function InputPanel({ onGenerate, isLoading }: Props) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"image-01" | "image-01-live">("image-01");
  const [aspect, setAspect] = useState<typeof ASPECT_OPTIONS[number]>("16:9");
  const [seed, setSeed] = useState("");
  const [refStrength, setRefStrength] = useState(1.0);  // 0.5 = subtle, 1.0 = standard, 1.5 = emphazise. Text-only prompt hint, MiniMax ignores a numeric param here.
  const [n, setN] = useState<number>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Always-refreshed mirror of files to avoid stale closure in doSubmit.
  const filesRef = useRef<File[]>([]);
  filesRef.current = files;

  const hasError = touched && !prompt.trim();

  const handleFiles = useCallback((incoming: FileList | null) => {
    console.log("[InputPanel] handleFiles called, incoming:", incoming?.length ?? "null");
    if (!incoming) return;
    const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif"];
    // Snapshot FileList immediately to avoid stale-reference issues with live FileList
    const valid = Array.from(incoming).filter((f) => {
      const ok = imageTypes.includes(f.type);
      console.log(`[InputPanel] file: ${f.name}, type: ${f.type}, ok: ${ok}`);
      return ok;
    });
    console.log("[InputPanel] valid files:", valid.length);
    if (valid.length > 0) {
      setFiles((prev) => {
        console.log("[InputPanel] setFiles, prev.length:", prev.length, "new total:", prev.length + valid.length);
        return [...prev, ...valid];
      });
      // Reset the hidden input value so the same file can be selected again
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const doSubmit = () => {
    console.log("[InputPanel] doSubmit called, filesRef.current.length:", filesRef.current.length);
    setTouched(true);
    if (!prompt.trim()) return;
    console.log("[InputPanel] calling onGenerate with references:", filesRef.current.length, "files");
    onGenerate({
      prompt: prompt.trim(),
      model,
      aspect_ratio: aspect,
      seed: seed === "" ? undefined : Number(seed),
      n,
      references: filesRef.current,
      // MiniMax API has no numeric ref_weight param; we hint via prompt word weight below.
      // referenceWeight removed (was passed but MiniMax silently ignored it).
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Prompt */}
        <div>
          <label className="field-label">
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Zap size={11} />
              Prompt
            </span>
          </label>
          <textarea
            className={`prompt-textarea${hasError ? " error" : ""}`}
            rows={4}
            placeholder="Describe the image you want to generate…"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (e.target.value) setTouched(false);
            }}
            onBlur={() => setTouched(true)}
            disabled={isLoading}
          />
          {hasError && (
            <p style={{ fontSize: "0.72rem", color: "var(--error)", marginTop: "0.3rem" }}>
              Please enter a prompt to generate an image.
            </p>
          )}
        </div>

        {/* Reference images */}
        <div>
          <label className="field-label" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <ImageIcon size={11} />
            Reference Images
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)" }}>
              (optional)
            </span>
          </label>
          <div
            className={`dropzone${isDragOver ? " drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={20} className="dropzone-icon" />
            <p>Drop images here or click to browse</p>
            <p className="dropzone-hint">JPEG, PNG, WebP, BMP, GIF</p>
          </div>

          {files.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.625rem" }}>
              {files.map((f, i) => (
                <span key={i} className="ref-chip">
                  <span className="ref-chip-name">{f.name}</span>
                  <button
                    type="button"
                    className="ref-chip-remove"
                    onClick={() => removeFile(i)}
                    disabled={isLoading}
                    aria-label={`Remove ${f.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick options */}
        <div className="options-grid">
          <div>
            <label className="field-label">Model</label>
            <div className="select-wrapper">
              <select
                className="form-select"
                value={model}
                onChange={(e) => setModel(e.target.value as typeof model)}
                disabled={isLoading}
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Aspect Ratio</label>
            <div className="select-wrapper">
              <select
                className="form-select"
                value={aspect}
                onChange={(e) => setAspect(e.target.value as typeof aspect)}
                disabled={isLoading}
              >
                {ASPECT_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advanced options toggle */}
        <button
          type="button"
          className="accordion-trigger"
          onClick={() => setShowAdvanced((v) => !v)}
          disabled={isLoading}
        >
          <span>Advanced Options</span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAdvanced && (
          <div className="options-grid" style={{ marginTop: "-0.5rem" }}>
            <div>
              <label className="field-label">
                Seed <span className="field-hint">(optional)</span>
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="Any integer"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="field-label">Number of Images</label>
              <input
                type="number"
                className="form-input"
                min={1}
                max={4}
                value={n}
                onChange={(e) => setN(Math.max(1, Math.min(4, Number(e.target.value))))}
                disabled={isLoading}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  Reference Influence
                  <span className="field-hint"> (hint weight, added to prompt)</span>
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-indigo)" }}>
                  {refStrength.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                className="form-slider"
                min={0.5}
                max={1.5}
                step={0.05}
                value={refStrength}
                onChange={(e) => setRefStrength(Number(e.target.value))}
                disabled={isLoading || files.length === 0}
                style={{ width: "100%" }}
                aria-label="Reference influence (added to prompt as weight hint)"
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                <span>0.5 (subtle)</span>
                <span>1.0 (default)</span>
                <span>1.5 (strong)</span>
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                MiniMax API does NOT support a numeric ref_weight — the slider value gets injected into your prompt as a weight hint (e.g. "high reference adherence"). For real weight tuning you'd need a different provider.
              </p>
            </div>
          </div>
        )}

        {/* Generate */}
        <button
          type="button"
          className="btn-generate"
          disabled={isLoading}
          onClick={doSubmit}
        >
          <Zap size={16} />
          {isLoading ? "Generating…" : "Generate Image"}
        </button>
      </form>

      {/* File input lives OUTSIDE the form to prevent form-submit interference */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ position: "absolute", left: "-9999px" }}
        onChange={(e) => {
          console.log("[InputPanel] onChange fired, files:", e.target.files?.length ?? "null");
          handleFiles(e.target.files);
        }}
        disabled={isLoading}
      />
    </>
  );
}
