"use client";

import { useRef, useState, useCallback } from "react";

interface Props {
  onFile: (file: File) => void;
  accept?: string;
  label?: string;
  hint?: string;
  file?: File | null;
}

export default function FileUploader({
  onFile,
  accept = ".hwpx,.pdf",
  label = "파일을 여기에 끌어놓거나 클릭하여 선택하세요",
  hint = "지원 형식: .hwpx, .pdf",
  file,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        w-full rounded-xl border-2 border-dashed p-8 text-center
        transition-colors duration-150 focus:outline-none
        ${dragging
          ? "border-blue-400 bg-blue-50"
          : file
            ? "border-green-400 bg-green-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      {file ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">✅</span>
          <p className="font-semibold text-green-700 text-sm">{file.name}</p>
          <p className="text-xs text-gray-400">클릭하여 다른 파일 선택</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">📎</span>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-xs text-gray-400">{hint}</p>
        </div>
      )}
    </button>
  );
}
