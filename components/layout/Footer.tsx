import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto bg-white border-t border-gray-200 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <Link href="/privacy" className="hover:text-gray-800 transition-colors">
            개인정보처리방침
          </Link>
          <span className="text-gray-300">|</span>
          <a href="mailto:sirons1124@gmail.com" className="hover:text-gray-800 transition-colors">
            문의하기
          </a>
        </div>
        <p className="mt-2">© 2026 티처툴즈 | 선생님을 위한 서비스</p>
        <p className="mt-1 text-xs text-gray-400">개발자: 석희철</p>
      </div>
    </footer>
  );
}
