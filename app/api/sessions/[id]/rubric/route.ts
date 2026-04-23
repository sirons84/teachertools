import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { DebateSessionState, RubricKey } from "@/lib/types/session";

export const maxDuration = 15;

interface RubricPatchItem {
  id: RubricKey;
  name?: string;
  descriptor?: string;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { criteria } = (await req.json()) as { criteria: RubricPatchItem[] };

    if (!Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json({ error: "criteria 배열이 필요합니다." }, { status: 400 });
    }

    const session = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
    const state = session.state as unknown as DebateSessionState;

    if (!state.A2?.rubric?.criteria) {
      return NextResponse.json({ error: "아직 루브릭이 생성되지 않았습니다." }, { status: 400 });
    }

    const patchMap = new Map<string, RubricPatchItem>();
    for (const c of criteria) {
      if (c?.id) patchMap.set(c.id, c);
    }

    const updated = state.A2.rubric.criteria.map((c) => {
      const p = patchMap.get(c.id);
      if (!p) return c;
      return {
        ...c,
        name: typeof p.name === "string" && p.name.trim() ? p.name.trim() : c.name,
        descriptor: typeof p.descriptor === "string" && p.descriptor.trim() ? p.descriptor.trim() : c.descriptor,
      };
    });

    const newState: DebateSessionState = {
      ...state,
      A2: { ...state.A2, rubric: { criteria: updated } },
    };

    await prisma.debateSession.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { state: JSON.parse(JSON.stringify(newState)) as any },
    });

    return NextResponse.json({ rubric: newState.A2!.rubric });
  } catch (err) {
    console.error("Rubric patch error:", err);
    return NextResponse.json({ error: "루브릭 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
