import { getOpenAI } from "./openai";
import { SUPPORTED_LANGUAGES } from "@/constants/languages";

const TRANSLATION_SYSTEM_PROMPT = `당신은 한국 초등학교/중학교 가정통신문 전문 번역가입니다.

규칙:
1. 교육 관련 용어는 해당 국가의 교육 체계에 맞게 의역합니다.
2. 날짜, 시간, 금액 등 숫자 정보는 정확하게 번역합니다.
3. 학교명, 교사명 등 고유명사는 음역합니다.
4. 존댓말/공손한 표현을 해당 언어의 관습에 맞게 사용합니다.
5. HTML 태그 구조는 유지하되, 텍스트만 번역합니다.
6. 표(table) 구조도 그대로 유지합니다.
7. class 속성은 절대 변경하지 마세요.`;

export async function translateDocument(
  html: string,
  targetLangCode: string
): Promise<{ content: string; html: string }> {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === targetLangCode);
  const targetLanguageName = lang?.nativeName ?? targetLangCode;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `다음 가정통신문 HTML을 ${targetLanguageName}(${targetLangCode})로 번역해주세요. HTML 태그와 class 속성은 그대로 유지하고 텍스트 내용만 번역하세요:\n\n${html}`,
      },
    ],
    temperature: 0.3,
  });

  const translatedHtml =
    response.choices[0]?.message?.content ?? html;

  // Strip HTML tags to get plain text
  const plainText = translatedHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return { content: plainText, html: translatedHtml };
}

export async function translateText(
  text: string,
  targetLangCode: string,
  sourceHint = "한국어"
): Promise<string> {
  if (targetLangCode === "ko") return text;

  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === targetLangCode);
  const targetLanguageName = lang?.nativeName ?? targetLangCode;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `${sourceHint} 텍스트를 ${targetLanguageName}로 자연스럽게 번역하세요. 번역 결과만 출력하세요.`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content ?? text;
}

export async function translateToKorean(text: string, sourceLangCode: string): Promise<string> {
  if (sourceLangCode === "ko") return text;

  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === sourceLangCode);
  const sourceLangName = lang?.nativeName ?? sourceLangCode;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `${sourceLangName} 텍스트를 한국어로 번역하세요. 번역 결과만 출력하세요.`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content ?? text;
}
