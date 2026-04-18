"use client";

import { useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/* ──────────────────────────────────────────────
   데이터
────────────────────────────────────────────── */

interface HangeulItem {
  char: string;
  name: string;
  example: string;      // 예시 단어
  exampleMeaning: string;
}

const CONSONANTS: HangeulItem[] = [
  { char: "ㄱ", name: "기역", example: "가방", exampleMeaning: "가방" },
  { char: "ㄴ", name: "니은", example: "나비", exampleMeaning: "나비" },
  { char: "ㄷ", name: "디귿", example: "다리", exampleMeaning: "다리" },
  { char: "ㄹ", name: "리을", example: "라면", exampleMeaning: "라면" },
  { char: "ㅁ", name: "미음", example: "마음", exampleMeaning: "마음" },
  { char: "ㅂ", name: "비읍", example: "바나나", exampleMeaning: "바나나" },
  { char: "ㅅ", name: "시옷", example: "사과", exampleMeaning: "사과" },
  { char: "ㅇ", name: "이응", example: "아이", exampleMeaning: "아이" },
  { char: "ㅈ", name: "지읒", example: "자전거", exampleMeaning: "자전거" },
  { char: "ㅊ", name: "치읓", example: "치마", exampleMeaning: "치마" },
  { char: "ㅋ", name: "키읔", example: "코끼리", exampleMeaning: "코끼리" },
  { char: "ㅌ", name: "티읕", example: "토끼", exampleMeaning: "토끼" },
  { char: "ㅍ", name: "피읖", example: "파란색", exampleMeaning: "파란색" },
  { char: "ㅎ", name: "히읗", example: "하늘", exampleMeaning: "하늘" },
];

const VOWELS: HangeulItem[] = [
  { char: "ㅏ", name: "아", example: "아기", exampleMeaning: "아기" },
  { char: "ㅑ", name: "야", example: "야구", exampleMeaning: "야구" },
  { char: "ㅓ", name: "어", example: "어머니", exampleMeaning: "어머니" },
  { char: "ㅕ", name: "여", example: "여우", exampleMeaning: "여우" },
  { char: "ㅗ", name: "오", example: "오리", exampleMeaning: "오리" },
  { char: "ㅛ", name: "요", example: "요리", exampleMeaning: "요리" },
  { char: "ㅜ", name: "우", example: "우산", exampleMeaning: "우산" },
  { char: "ㅠ", name: "유", example: "유리", exampleMeaning: "유리" },
  { char: "ㅡ", name: "으", example: "으쓱", exampleMeaning: "으쓱" },
  { char: "ㅣ", name: "이", example: "이불", exampleMeaning: "이불" },
  { char: "ㅐ", name: "애", example: "애벌레", exampleMeaning: "애벌레" },
  { char: "ㅒ", name: "얘", example: "얘기", exampleMeaning: "얘기" },
  { char: "ㅔ", name: "에", example: "에어컨", exampleMeaning: "에어컨" },
  { char: "ㅖ", name: "예", example: "예쁘다", exampleMeaning: "예쁘다" },
  { char: "ㅘ", name: "와", example: "와플", exampleMeaning: "와플" },
  { char: "ㅙ", name: "왜", example: "왜냐면", exampleMeaning: "왜냐면" },
  { char: "ㅚ", name: "외", example: "외투", exampleMeaning: "외투" },
  { char: "ㅝ", name: "워", example: "워터파크", exampleMeaning: "워터파크" },
  { char: "ㅞ", name: "웨", example: "웨딩", exampleMeaning: "웨딩" },
  { char: "ㅟ", name: "위", example: "위층", exampleMeaning: "위층" },
  { char: "ㅢ", name: "의", example: "의사", exampleMeaning: "의사" },
];

/* ──────────────────────────────────────────────
   Web Speech API 헬퍼
────────────────────────────────────────────── */

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ko-KR";
  utter.rate = 0.85;
  window.speechSynthesis.speak(utter);
}

/* ──────────────────────────────────────────────
   컴포넌트
────────────────────────────────────────────── */

type Tab = "consonant" | "vowel";

export default function HangeulPage() {
  const [tab, setTab] = useState<Tab>("consonant");
  const [selected, setSelected] = useState<HangeulItem | null>(null);

  const items = tab === "consonant" ? CONSONANTS : VOWELS;

  const handleSelect = useCallback((item: HangeulItem) => {
    setSelected(item);
    speak(item.name);
  }, []);

  const handleSpeak = useCallback(() => {
    if (selected) speak(selected.name);
  }, [selected]);

  const handleSpeakExample = useCallback(() => {
    if (selected) speak(selected.example);
  }, [selected]);

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 font-bold text-teal-600">가나다</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] mb-2">
            한글 자음·모음 배우기
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            글자를 누르면 이름을 들을 수 있어요
          </p>
        </div>

        {/* 탭 */}
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={() => { setTab("consonant"); setSelected(null); }}
            className={`px-8 py-3 rounded-full text-lg font-bold transition-all shadow-sm ${
              tab === "consonant"
                ? "bg-teal-600 text-white shadow-teal-200"
                : "bg-white text-gray-500 border-2 border-gray-200 hover:border-teal-300"
            }`}
          >
            자음 (14개)
          </button>
          <button
            onClick={() => { setTab("vowel"); setSelected(null); }}
            className={`px-8 py-3 rounded-full text-lg font-bold transition-all shadow-sm ${
              tab === "vowel"
                ? "bg-teal-600 text-white shadow-teal-200"
                : "bg-white text-gray-500 border-2 border-gray-200 hover:border-teal-300"
            }`}
          >
            모음 (21개)
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* 글자 그리드 */}
          <div className="flex-1">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {items.map((item) => {
                const isSelected = selected?.char === item.char;
                return (
                  <button
                    key={item.char}
                    onClick={() => handleSelect(item)}
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-2xl
                      border-2 transition-all duration-150 select-none
                      ${isSelected
                        ? "border-teal-500 bg-teal-50 shadow-md shadow-teal-100 scale-105"
                        : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50 hover:scale-105 active:scale-95"}
                    `}
                  >
                    <span className={`font-bold leading-none transition-all ${isSelected ? "text-teal-700" : "text-[#1E293B]"}`}
                      style={{ fontSize: "clamp(1.8rem, 5vw, 2.5rem)" }}
                    >
                      {item.char}
                    </span>
                    <span className={`text-xs mt-1 font-medium ${isSelected ? "text-teal-600" : "text-gray-400"}`}>
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 선택된 글자 패널 */}
          <div className="lg:w-64 xl:w-72">
            {selected ? (
              <div className="bg-white rounded-2xl border-2 border-teal-200 p-6 flex flex-col items-center gap-4 shadow-sm sticky top-6">
                {/* 큰 글자 */}
                <div
                  className="w-32 h-32 flex items-center justify-center rounded-2xl bg-teal-50 border-2 border-teal-200 cursor-pointer hover:bg-teal-100 active:scale-95 transition-all"
                  onClick={handleSpeak}
                  title="눌러서 듣기"
                >
                  <span className="text-7xl font-bold text-teal-700 leading-none">
                    {selected.char}
                  </span>
                </div>

                {/* 이름 */}
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">이름</p>
                  <p className="text-2xl font-bold text-[#1E293B]">{selected.name}</p>
                </div>

                {/* 발음 듣기 버튼 */}
                <button
                  onClick={handleSpeak}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-base transition-all"
                >
                  <span>🔊</span>
                  <span>이름 듣기</span>
                </button>

                {/* 예시 단어 */}
                <div className="w-full bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">예시 단어</p>
                  <p className="text-xl font-bold text-[#1E293B]">{selected.example}</p>
                </div>

                {/* 예시 단어 듣기 */}
                <button
                  onClick={handleSpeakExample}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-teal-300 hover:bg-teal-50 active:scale-95 text-teal-700 font-semibold text-sm transition-all"
                >
                  <span>🔉</span>
                  <span>단어 듣기</span>
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center gap-3 text-center h-full min-h-[16rem]">
                <div className="text-4xl">👆</div>
                <p className="text-gray-400 font-medium">
                  글자를 눌러서<br />자세히 알아보세요
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 p-4 bg-teal-50 rounded-xl border border-teal-100 text-center">
          <p className="text-sm text-teal-700">
            <span className="font-bold">TIP</span> — 글자 카드를 누르면 이름을 읽어줘요. 스피커가 켜져 있어야 소리가 들려요.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
