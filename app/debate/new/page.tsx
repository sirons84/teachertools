import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { DebateSessionState } from "@/lib/types/session";

export const dynamic = "force-dynamic";

export default async function DebateNewPage() {
  const initialState: DebateSessionState = {
    sessionId: "",
    meta: { topic: "" },
    approvals: {},
  };

  const session = await prisma.debateSession.create({
    data: {
      topic: "(작성 중)",
      stage: "A1_READY",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state: JSON.parse(JSON.stringify(initialState)) as any,
    },
  });

  await prisma.debateSession.update({
    where: { id: session.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { state: JSON.parse(JSON.stringify({ ...initialState, sessionId: session.id })) as any },
  });

  redirect(`/debate/${session.id}`);
}
