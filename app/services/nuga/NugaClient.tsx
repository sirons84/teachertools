"use client";

import { useCallback, useState } from "react";
import Overview from "./Overview";
import RecordScreen from "./RecordScreen";
import RosterSetup from "./RosterSetup";
import StudentDetail from "./StudentDetail";
import { saveRecords, saveRoster, useNugaState } from "@/lib/nuga-store";
import { rosterToText, type NugaRecord, type RosterEntry } from "@/lib/nuga";

type View = "record" | "overview" | "student" | "roster";

const STORAGE_FAIL =
  "브라우저 저장소에 쓸 수 없습니다. 시크릿 모드이거나 저장 공간이 가득 찼는지 확인해 주세요.";

export default function NugaClient() {
  const { roster, records, loaded } = useNugaState();
  const [view, setView] = useState<View>("record");
  const [activeNo, setActiveNo] = useState<number | null>(null);

  const persistRoster = useCallback((next: RosterEntry[]) => {
    if (!saveRoster(next)) alert(STORAGE_FAIL);
  }, []);

  const persistRecords = useCallback((next: NugaRecord[]) => {
    if (!saveRecords(next)) alert(STORAGE_FAIL);
  }, []);

  const addRecord = useCallback(
    (record: NugaRecord) => persistRecords([...records, record]),
    [persistRecords, records]
  );

  const updateRecord = useCallback(
    (id: string, text: string) =>
      persistRecords(records.map((r) => (r.id === id ? { ...r, text, edited: true } : r))),
    [persistRecords, records]
  );

  const deleteRecord = useCallback(
    (id: string) => persistRecords(records.filter((r) => r.id !== id)),
    [persistRecords, records]
  );

  const openStudent = useCallback((no: number) => {
    setActiveNo(no);
    setView("student");
  }, []);

  if (!loaded) {
    return <div className="py-20 text-center text-sm text-gray-400">불러오는 중…</div>;
  }

  /* ── 명단 등록 / 수정 ──────────────────────── */
  if (view === "roster" || roster.length === 0) {
    return (
      <RosterSetup
        initialText={rosterToText(roster)}
        onSave={(next) => {
          persistRoster(next);
          setView("record");
        }}
        onCancel={roster.length > 0 ? () => setView("record") : undefined}
      />
    );
  }

  const activeStudent = roster.find((r) => r.no === activeNo) ?? null;

  return (
    <div>
      {/* 탭 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3">
        <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold">
          <button
            type="button"
            onClick={() => setView("record")}
            className={`px-4 py-2 transition-colors ${
              view === "record" || view === "student"
                ? "bg-rose-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            🎙️ 기록
          </button>
          <button
            type="button"
            onClick={() => setView("overview")}
            className={`px-4 py-2 transition-colors ${
              view === "overview"
                ? "bg-rose-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            📋 전체 보기
          </button>
        </div>
      </div>

      <div className="mt-3">
        {view === "record" && (
          <RecordScreen
            roster={roster}
            records={records}
            onCreate={addRecord}
            onOpenStudent={openStudent}
          />
        )}

        {view === "student" &&
          (activeStudent ? (
            <StudentDetail
              student={activeStudent}
              records={records}
              onUpdate={updateRecord}
              onDelete={deleteRecord}
              onBack={() => setView("record")}
            />
          ) : (
            <div className="py-16 text-center text-sm text-gray-400">
              학생을 찾을 수 없습니다.
            </div>
          ))}

        {view === "overview" && (
          <Overview
            roster={roster}
            records={records}
            onOpenStudent={openStudent}
            onEditRoster={() => setView("roster")}
            onClearAll={() => persistRecords([])}
          />
        )}
      </div>
    </div>
  );
}
