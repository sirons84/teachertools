import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ClassMate AI — 수업용 AI 친구",
  description: "수업에서 궁금한 걸 AI에게 물어보세요. 로그인 없이 바로 시작.",
};

export default function ClassmateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="classmate-root h-screen w-screen overflow-hidden">{children}</div>;
}
