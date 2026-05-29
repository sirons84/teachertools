import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import type { Constraints, Student } from "@/lib/seat-arrangement";

export const maxDuration = 30;

type ParseInput = {
  students: Student[];
  text: string;
};

type RawConstraints = {
  separate?: Array<[string, string]>;
  pair?: Array<[string, string]>;
  front?: string[];
  back?: string[];
  avoidGroup?: Array<[string, string]>;
  groupTogether?: Array<[string, string]>;
};

function resolveName(students: Student[], name: string): number | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  // 번호로도 검색 가능
  const numMatch = trimmed.match(/^(\d+)\s*번?$/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    const byNum = students.find((s) => s.num === n);
    if (byNum) return byNum.id;
  }
  // 이름 정확히 일치
  const exact = students.find((s) => s.name === trimmed);
  if (exact) return exact.id;
  // 이름 부분 일치 (성을 뺀 이름)
  const partial = students.find(
    (s) => s.name.endsWith(trimmed) || s.name.includes(trimmed)
  );
  return partial ? partial.id : null;
}

function resolveConstraints(students: Student[], raw: RawConstraints): Constraints {
  const out: Constraints = {};
  const pair2 = (
    arr: Array<[string, string]> | undefined
  ): Array<[number, number]> => {
    if (!arr) return [];
    const result: Array<[number, number]> = [];
    for (const [a, b] of arr) {
      const ia = resolveName(students, a);
      const ib = resolveName(students, b);
      if (ia != null && ib != null && ia !== ib) result.push([ia, ib]);
    }
    return result;
  };
  const list = (arr: string[] | undefined): number[] => {
    if (!arr) return [];
    const result: number[] = [];
    for (const n of arr) {
      const id = resolveName(students, n);
      if (id != null) result.push(id);
    }
    return result;
  };

  out.separate = pair2(raw.separate);
  out.pair = pair2(raw.pair);
  out.front = list(raw.front);
  out.back = list(raw.back);
  out.avoidGroup = pair2(raw.avoidGroup);
  out.groupTogether = pair2(raw.groupTogether);
  return out;
}

const SYSTEM_PROMPT = `너는 한국 초등학교 교실의 자리 배치 요청을 구조화 JSON 으로 변환하는 도우미다.
입력으로 학생 명단(이름, 번호, 성별, 성적, 특이사항)과 교사의 자연어 요청이 들어온다.
요청을 다음 카테고리로 분류하여 JSON 으로만 출력하라.

스키마:
{
  "separate":      [["이름A","이름B"], ...],  // 서로 멀리 떨어뜨릴 학생 쌍
  "pair":          [["이름A","이름B"], ...],  // 짝꿍/가까이 앉히고 싶은 학생 쌍 (가로 또는 세로 인접)
  "front":         ["이름A","이름B", ...],     // 교탁(앞자리)에 가깝게 앉힐 학생
  "back":          ["이름A", ...],             // 뒷자리로 보낼 학생
  "avoidGroup":    [["이름A","이름B"], ...],  // 같은 모둠이면 안 되는 쌍
  "groupTogether": [["이름A","이름B"], ...]   // 같은 모둠이 되어야 하는 쌍
}

규칙:
- 이름은 반드시 입력된 학생 명단의 정확한 이름을 사용한다. 추측 금지.
- "산만한 학생끼리 떨어뜨려" 같은 메타 표현은 특이사항이 매칭되는 학생들의 모든 쌍을 separate 로 펼친다.
- "요주의 학생 앞자리" 같은 표현은 front 에 해당 학생 전원을 넣는다.
- 해당 카테고리가 없으면 빈 배열로 둔다.
- 다른 키 / 설명 / 마크다운 절대 금지. JSON 만 출력.`;

export async function POST(req: NextRequest) {
  try {
    const { students, text } = (await req.json()) as ParseInput;
    if (!Array.isArray(students) || !students.length) {
      return NextResponse.json({ success: false, error: "학생 명단이 필요합니다." }, { status: 400 });
    }
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ success: true, constraints: {} as Constraints });
    }

    const studentSummary = students
      .map((s) => `- ${s.name} (${s.num}번, ${s.gender}, 성적 ${s.rank}, 특이: ${s.note || "없음"})`)
      .join("\n");

    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `학생 명단:\n${studentSummary}\n\n교사 요청:\n"""${text.trim()}"""\n\n위 요청을 JSON 으로 변환하라.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    let raw: RawConstraints = {};
    try {
      raw = JSON.parse(content) as RawConstraints;
    } catch {
      raw = {};
    }

    const constraints = resolveConstraints(students, raw);
    return NextResponse.json({ success: true, constraints, raw });
  } catch (err) {
    console.error("[seat-arrangement] parse-constraints error:", err);
    return NextResponse.json(
      { success: false, error: "요청 해석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
