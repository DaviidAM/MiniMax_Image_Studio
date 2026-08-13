"use client";

interface Props {
  imageUrls: string[];
  prompt: string;
  referenceFiles: File[];
  error: string | null;
  isLoading: boolean;
}

export default function OutputPanel({ imageUrls, prompt, referenceFiles, error, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p>Generating your image(s)...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-red-600">
        <p className="font-medium">Error</p>
        <p className="text-sm text-center text-red-500">{error}</p>
      </div>
    );
  }

  if (imageUrls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p>Your generated image(s) will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      {/* Images */}
      <div className={`grid gap-3 ${imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {imageUrls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Generated image ${i + 1}`}
            className="w-full rounded border object-contain"
            style={{ maxHeight: "60vh" }}
          />
        ))}
      </div>

      {/* Prompt + references used */}
      <div className="text-sm text-gray-600 border-t pt-3">
        <p className="font-medium text-gray-800 mb-1">Prompt</p>
        <p className="whitespace-pre-wrap">{prompt}</p>

        {referenceFiles.length > 0 && (
          <>
            <p className="font-medium text-gray-800 mt-3 mb-1">Reference Images</p>
            <ul className="flex flex-wrap gap-2">
              {referenceFiles.map((f, i) => (
                <li key={i} className="text-xs bg-gray-100 rounded px-2 py-1">{f.name}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
