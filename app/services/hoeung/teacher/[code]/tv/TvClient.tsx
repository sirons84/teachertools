"use client";

import useSWR from "swr";
import JoinQr from "@/components/hoeung/JoinQr";
import type { TvData } from "@/lib/hoeung/dashboard";

async function fetcher(url: string): Promise<TvData> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("불러오기 실패");
  return res.json();
}

/** 교실 TV용 — 익명(번호·이름 없음), 큰 글씨, 흰 배경, 10초 폴링 */
export default function TvClient({ code }: { code: string }) {
  const { data } = useSWR<TvData>(`/api/hoeung/rooms/${code}/tv`, fetcher, {
    refreshInterval: 10_000,
    revalidateOnFocus: true,
  });

  return (
    <div className="flex min-h-screen flex-col bg-white px-[4vw] py-[3vh] text-gray-900">
      <header className="flex items-center justify-between gap-8">
        <div>
          <h1 className="text-[3.2vw] font-bold leading-tight">✏️ 문장 호응 체크</h1>
          <p className="mt-1 text-[1.8vw] text-gray-500">
            {data ? `${data.studentCount}명이 함께 풀고 있어요` : "불러오는 중…"}
            {data && data.finishedCount > 0 ? ` · 끝까지 한 친구 ${data.finishedCount}명` : ""}
          </p>
        </div>
        <div className="flex items-center gap-[2vw]">
          <div className="text-right">
            <p className="text-[1.6vw] text-gray-500">방 코드</p>
            <p className="font-mono text-[7vw] font-bold leading-none tracking-[0.15em]">{code}</p>
          </div>
          <JoinQr code={code} size={160} />
        </div>
      </header>

      <main className="mt-[4vh] flex flex-1 flex-col justify-around gap-[3vh]">
        {(data?.parts ?? []).map((p) => (
          <section key={p.part}>
            <div className="flex items-baseline justify-between gap-6">
              <h2 className="text-[2.8vw] font-bold">
                PART {p.part}
                <span className="ml-[1vw] text-[2.2vw] font-semibold text-gray-500">
                  {p.title}
                </span>
              </h2>
              <p className="text-[2.2vw] tabular-nums text-gray-600">
                지금 <span className="font-bold text-blue-600">{p.hereCount}명</span> · 끝낸 친구{" "}
                <span className="font-bold text-green-600">{p.doneCount}명</span>
              </p>
            </div>
            <div className="mt-[1.2vh] h-[5.5vh] overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-[width] duration-700"
                style={{ width: `${p.percent}%` }}
              />
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
