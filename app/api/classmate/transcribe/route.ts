import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // OpenAI limit

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "오디오 파일이 누락되었습니다." },
        { status: 400 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: "녹음 길이가 너무 짧아요." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: "오디오 파일이 너무 큽니다 (25MB 초과)." },
        { status: 413 }
      );
    }

    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return NextResponse.json({
      success: true,
      text: transcription.text ?? "",
    });
  } catch (err) {
    console.error("Transcribe error:", err);
    return NextResponse.json(
      { success: false, error: "음성 인식 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
