"use client";

import { useCallback, useRef, useState } from "react";
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
  const [seed, setSeed] = useState<string>("");
  const [n, setN] = useState<number>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif"];
    const valid = Array.from(incoming).filter((f) => imageTypes.includes(f.type));
    setFiles((prev) => [...prev, ...valid]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate({
      prompt: prompt.trim(),
      model,
      aspect_ratio: aspect,
      seed: seed === "" ? undefined : Number(seed),
      n,
      references: files,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium mb-1">Prompt</label>
        <textarea
          className="w-full border rounded p-2 text-sm resize-y"
          rows={4}
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {/* Reference images */}
      <div>
        <label className="block text-sm font-medium mb-1">Reference Images</label>
        <div
          className={`border-2 border-dashed rounded p-4 text-center text-sm cursor-pointer transition-colors ${
            isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <p>Drop images here or click to browse</p>
          <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP, BMP, GIF</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={isLoading}
          />
        </div>

        {files.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                <span className="truncate max-w-[120px]">{f.name}</span>
                <button
                  type="button"
                  className="text-red-500 font-bold"
                  onClick={() => removeFile(i)}
                  disabled={isLoading}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Options row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <select
            className="w-full border rounded p-2 text-sm"
            value={model}
            onChange={(e) => setModel(e.target.value as typeof model)}
            disabled={isLoading}
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Aspect Ratio</label>
          <select
            className="w-full border rounded p-2 text-sm"
            value={aspect}
            onChange={(e) => setAspect(e.target.value as typeof aspect)}
            disabled={isLoading}
          >
            {ASPECT_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Seed <span className="font-normal text-gray-500">(optional)</span></label>
          <input
            type="number"
            className="w-full border rounded p-2 text-sm"
            placeholder="Any integer"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Number of Images</label>
          <input
            type="number"
            className="w-full border rounded p-2 text-sm"
            min={1}
            max={4}
            value={n}
            onChange={(e) => setN(Math.max(1, Math.min(4, Number(e.target.value))))}
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-auto w-full bg-blue-600 text-white rounded p-3 font-medium disabled:opacity-50"
        disabled={isLoading || !prompt.trim()}
      >
        {isLoading ? "Generating..." : "Generate Image"}
      </button>
    </form>
  );
}
