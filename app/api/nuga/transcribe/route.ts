import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

/**
 * 음성 누가기록 STT 프록시.
 *
 * 이 라우트가 하는 일은 딱 하나 — 오디오를 받아 OpenAI 로 넘기고 텍스트를 돌려준다.
 * · API 키는 서버 환경변수(OPENAI_API_KEY)에만 존재한다 (브라우저 직접 호출 금지)
 * · 오디오도 인식된 텍스트도 저장하지 않는다 (DB 없음)
 * · 인식 결과를 로그에 남기지 않는다 (관찰 문장은 학생 정보다)
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // OpenAI 업로드 한도

const PRIMARY_MODEL = "gpt-4o-mini-transcribe";
const FALLBACK_MODEL = "whisper-1";

/** 번호와 교실 어휘를 미리 알려 주면 오인식이 줄어든다. */
const PROMPT_HINT =
  "초등학교 교실 관찰 기록입니다. 문장은 1번부터 24번까지의 학생 번호로 시작합니다. " +
  "자주 나오는 말: 발표, 모둠, 토의, 협력, 질문, 과제, 집중, 도움, 정리, 끝까지, 먼저, 스스로.";

export async function POST(req: NextRequest) {
  let file: File;

  try {
    const formData = await req.formData();
    const raw = formData.get("file") ?? formData.get("audio");
    if (!raw || !(raw instanceof File)) {
      return NextResponse.json(
        { success: false, error: "오디오 파일이 없습니다." },
        { status: 400 }
      );
    }
    if (raw.size === 0) {
      return NextResponse.json(
        { success: false, error: "녹음 길이가 너무 짧아요. 다시 말해 주세요." },
        { status: 400 }
      );
    }
    if (raw.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: "오디오가 너무 큽니다 (25MB 초과)." },
        { status: 413 }
      );
    }
    file = raw;
  } catch {
    return NextResponse.json(
      { success: false, error: "요청을 읽지 못했습니다." },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { success: false, error: "서버에 OPENAI_API_KEY가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  const openai = getOpenAI();

  const transcribe = (model: string) =>
    openai.audio.transcriptions.create({
      file,
      model,
      language: "ko",
      prompt: PROMPT_HINT,
      response_format: "json",
    });

  try {
    let text = "";
    try {
      const r = await transcribe(PRIMARY_MODEL);
      text = r.text ?? "";
    } catch (primaryErr) {
      // 모델 미사용 계정 등 — 한 번만 폴백
      console.warn(
        "[nuga] primary STT model failed, falling back:",
        primaryErr instanceof Error ? primaryErr.message : "unknown"
      );
      const r = await transcribe(FALLBACK_MODEL);
      text = r.text ?? "";
    }

    // 인식 결과는 로그에 남기지 않는다.
    return NextResponse.json({ success: true, text: text.trim() });
  } catch (err) {
    console.error(
      "[nuga] transcribe failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { success: false, error: "음성 인식에 실패했습니다. 직접 입력해 주세요." },
      { status: 502 }
    );
  }
}
