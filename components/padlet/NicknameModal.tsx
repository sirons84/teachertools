"use client";

import { useState } from "react";

export default function NicknameModal({
  initialValue,
  onSubmit,
  title = "닉네임을 입력하세요",
  description = "이 보드에서 사용할 닉네임을 입력해주세요. (2~20자)",
  cancellable = false,
  onCancel,
}: {
  initialValue?: string;
  onSubmit: (nickname: string) => void;
  title?: string;
  description?: string;
  cancellable?: boolean;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = value.trim();
    if (t.length < 2 || t.length > 20) {
      setError("닉네임은 2~20자여야 합니다.");
      return;
    }
    setError(null);
    onSubmit(t);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🙂</div>
          <h2 className="font-bold text-[#1E293B]">{title}</h2>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={20}
          placeholder="예: 행복한고양이"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-blue-400 text-center"
        />
        {error && (
          <p className="text-xs text-red-600 text-center">{error}</p>
        )}
        <div className="flex gap-2 pt-1">
          {cancellable && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl text-sm"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm"
          >
            확인
          </button>
        </div>
      </form>
    </div>
  );
}
