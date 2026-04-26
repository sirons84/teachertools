import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "ClassMate AI — 수업용 AI 친구",
  description: "수업에서 궁금한 걸 AI에게 물어보세요.",
};

export default async function ClassmateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <div className="classmate-root h-screen w-screen overflow-hidden">
      <SessionProvider session={session}>{children}</SessionProvider>
    </div>
  );
}
