"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-[#2563EB] hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">🏫</span>
          <span>티처툴즈</span>
        </Link>

        {!isHome && (
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
          >
            <span>←</span>
            <span>홈으로</span>
          </Link>
        )}
      </div>
    </header>
  );
}
