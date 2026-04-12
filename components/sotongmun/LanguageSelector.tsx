"use client";

import { SUPPORTED_LANGUAGES, type LangCode } from "@/constants/languages";

interface Props {
  value: LangCode;
  onChange: (code: LangCode) => void;
}

export default function LanguageSelector({ value, onChange }: Props) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LangCode)}
        className="
          w-full appearance-none bg-white border-2 border-gray-200 rounded-xl
          pl-4 pr-10 py-3 text-sm font-medium text-gray-700
          focus:outline-none focus:border-blue-400
          cursor-pointer
        "
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        ▼
      </div>
    </div>
  );
}
