"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrangeSeats,
  INITIAL_STUDENTS,
  swapSeats,
  type Arrangement,
  type Constraints,
  type Student,
} from "@/lib/seat-arrangement";

type ViewMode = "student" | "teacher";

const NOTE_ABBR: Array<{ key: string; label: string; tone: string }> = [
  { key: "산만", label: "산만", tone: "bg-amber-100 text-amber-700" },
  { key: "행동", label: "행동", tone: "bg-rose-100 text-rose-700" },
  { key: "학습부진", label: "학부", tone: "bg-purple-100 text-purple-700" },
  { key: "다문화", label: "다문", tone: "bg-emerald-100 text-emerald-700" },
];

function noteBadges(note: string) {
  if (!note) return [];
  const found = NOTE_ABBR.filter((n) => note.includes(n.key));
  if (found.length) return found;
  // 별 표시 등 기타 메모 — 첫 12자 미리보기
  return [{ key: "etc", label: note.length > 8 ? note.slice(0, 8) + "…" : note, tone: "bg-gray-100 text-gray-600" }];
}

function StudentCard({
  student,
  showInfo,
  flipped,
}: {
  student: Student;
  showInfo: boolean;
  flipped: boolean;
}) {
  const isMale = student.gender === "남";
  const base = isMale
    ? "from-blue-50 to-blue-100 border-blue-200 text-blue-900"
    : "from-rose-50 to-pink-100 border-pink-200 text-rose-900";
  const dot = isMale ? "bg-blue-500" : "bg-pink-500";
  const badges = showInfo ? noteBadges(student.note) : [];

  return (
    <div
      className={`relative w-full h-full rounded-2xl border bg-gradient-to-br ${base} shadow-sm p-2 sm:p-3 flex flex-col items-center justify-center gap-1 transition-all select-none ${flipped ? "rotate-180" : ""}`}
    >
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
        <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">{student.num}번</span>
      </div>
      {showInfo && (
        <span className="absolute top-1.5 right-1.5 text-[10px] font-semibold text-gray-500">
          #{student.rank}
        </span>
      )}
      <div className="text-sm sm:text-base font-bold leading-tight mt-1">{student.name}</div>
      {showInfo && badges.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-0.5">
          {badges.map((b) => (
            <span key={b.key} className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium ${b.tone}`}>
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableCard({
  seatIdx,
  student,
  showInfo,
  flipped,
}: {
  seatIdx: number;
  student: Student;
  showInfo: boolean;
  flipped: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `seat-${seatIdx}`,
  });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
    touchAction: "none",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-full h-full"
    >
      <StudentCard student={student} showInfo={showInfo} flipped={flipped} />
    </div>
  );
}

function DroppableSeat({
  seatIdx,
  children,
  highlight,
}: {
  seatIdx: number;
  children: React.ReactNode;
  highlight: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${seatIdx}` });
  return (
    <div
      ref={setNodeRef}
      className={`aspect-[5/4] sm:aspect-[6/5] rounded-2xl border-2 border-dashed transition-colors ${
        isOver ? "border-blue-400 bg-blue-50/60" : highlight ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-gray-50/50"
      }`}
    >
      {children}
    </div>
  );
}

function StudentEditor({
  students,
  setStudents,
  onClose,
}: {
  students: Student[];
  setStudents: (s: Student[]) => void;
  onClose: () => void;
}) {
  const update = (id: number, patch: Partial<Student>) => {
    setStudents(students.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const remove = (id: number) => setStudents(students.filter((s) => s.id !== id));
  const add = () => {
    const nextId = Math.max(0, ...students.map((s) => s.id)) + 1;
    const nextNum = Math.max(0, ...students.map((s) => s.num)) + 1;
    setStudents([
      ...students,
      { id: nextId, name: "새 학생", num: nextNum, gender: "남", rank: 1, note: "" },
    ]);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-[#1E293B]">학생 명단 편집</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs sticky top-0">
              <tr>
                <th className="px-2 py-2 text-left">번호</th>
                <th className="px-2 py-2 text-left">이름</th>
                <th className="px-2 py-2 text-left">성별</th>
                <th className="px-2 py-2 text-left">성적</th>
                <th className="px-2 py-2 text-left">특이사항</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={s.num}
                      onChange={(e) => update(s.id, { num: parseInt(e.target.value || "0", 10) })}
                      className="w-14 border rounded px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={s.name}
                      onChange={(e) => update(s.id, { name: e.target.value })}
                      className="w-24 border rounded px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={s.gender}
                      onChange={(e) => update(s.id, { gender: e.target.value as Student["gender"] })}
                      className="border rounded px-2 py-1"
                    >
                      <option value="남">남</option>
                      <option value="여">여</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={s.rank}
                      onChange={(e) => update(s.id, { rank: parseInt(e.target.value || "0", 10) })}
                      className="w-16 border rounded px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={s.note}
                      onChange={(e) => update(s.id, { note: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                      placeholder="예: 산만, 행동, 학습부진, 다문화"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      onClick={() => remove(s.id)}
                      className="text-rose-500 hover:text-rose-700 text-xs"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center gap-2">
          <button onClick={add} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            + 학생 추가
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>총 {students.length}명 (남 {students.filter((s) => s.gender === "남").length} / 여 {students.filter((s) => s.gender === "여").length})</span>
            <button
              onClick={() => setStudents(INITIAL_STUDENTS)}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              기본값으로
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConstraintSummary({ constraints, students }: { constraints: Constraints; students: Student[] }) {
  const nameOf = (id: number) => students.find((s) => s.id === id)?.name ?? `#${id}`;
  const rows: Array<{ label: string; items: string[] }> = [];
  if (constraints.separate?.length)
    rows.push({ label: "떨어뜨림", items: constraints.separate.map(([a, b]) => `${nameOf(a)} ↔ ${nameOf(b)}`) });
  if (constraints.pair?.length)
    rows.push({ label: "짝꿍", items: constraints.pair.map(([a, b]) => `${nameOf(a)} + ${nameOf(b)}`) });
  if (constraints.avoidGroup?.length)
    rows.push({ label: "다른 모둠", items: constraints.avoidGroup.map(([a, b]) => `${nameOf(a)} ⊘ ${nameOf(b)}`) });
  if (constraints.groupTogether?.length)
    rows.push({ label: "같은 모둠", items: constraints.groupTogether.map(([a, b]) => `${nameOf(a)} & ${nameOf(b)}`) });
  if (constraints.front?.length) rows.push({ label: "앞자리", items: constraints.front.map(nameOf) });
  if (constraints.back?.length) rows.push({ label: "뒷자리", items: constraints.back.map(nameOf) });

  if (!rows.length) return null;
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
      <div className="font-semibold text-emerald-800">반영된 추가 요청</div>
      {rows.map((r) => (
        <div key={r.label} className="text-emerald-900">
          <span className="font-medium">{r.label}:</span> {r.items.join(", ")}
        </div>
      ))}
    </div>
  );
}

export default function SeatArrangementClient() {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [view, setView] = useState<ViewMode>("student");
  const [noteFrontPriority, setNoteFrontPriority] = useState(true);
  const [requirements, setRequirements] = useState("");
  const [parsedConstraints, setParsedConstraints] = useState<Constraints>({});
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState<{ rows: number; cols: number }>({ rows: 4, cols: 6 });
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const firstRun = useRef(true);

  const studentMap = useMemo(() => {
    const m = new Map<number, Student>();
    for (const s of students) m.set(s.id, s);
    return m;
  }, [students]);

  // 최초 진입 시 자동 1회 배치
  useEffect(() => {
    if (!firstRun.current) return;
    firstRun.current = false;
    handleArrange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleArrange() {
    setError(null);
    setLoading(true);
    try {
      let constraints: Constraints = {};
      if (requirements.trim()) {
        const res = await fetch("/api/seat-arrangement/parse-constraints", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ students, text: requirements }),
        });
        const data = (await res.json()) as { success: boolean; constraints?: Constraints; error?: string };
        if (!data.success) throw new Error(data.error || "요청 해석 실패");
        constraints = data.constraints ?? {};
        setParsedConstraints(constraints);
      } else {
        setParsedConstraints({});
      }
      const arr = arrangeSeats(students, {
        rows: layout.rows,
        cols: layout.cols,
        noteFrontPriority,
        constraints,
        attempts: 800,
      });
      setArrangement(arr);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "자리 배치 중 오류");
    } finally {
      setLoading(false);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    if (!arrangement) return;
    const a = e.active.id;
    const b = e.over?.id;
    if (!b) return;
    const aIdx = Number(String(a).replace("seat-", ""));
    const bIdx = Number(String(b).replace("slot-", ""));
    if (Number.isNaN(aIdx) || Number.isNaN(bIdx) || aIdx === bIdx) return;
    setArrangement({ ...arrangement, seats: swapSeats(arrangement.seats, aIdx, bIdx) });
  }

  // 좌석을 row, col 기준 정렬하고 view 에 따라 뒤집기
  const orderedSeats = useMemo(() => {
    const seats = arrangement?.seats ?? [];
    const withIndex = seats.map((s, idx) => ({ ...s, idx }));
    withIndex.sort((a, b) => a.row - b.row || a.col - b.col);
    if (view === "teacher") {
      withIndex.reverse();
    }
    return withIndex;
  }, [arrangement, view]);

  const seatFlipped = view === "teacher";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 print:py-0 print:px-0 print:max-w-none">
      {/* 컨트롤 패널 */}
      <div className="print:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleArrange}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            {loading ? "배치 중..." : "🎲 자리 정하기"}
          </button>
          <button
            onClick={() => setShowInfo((v) => !v)}
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium"
          >
            {showInfo ? "👁️ 정보 숨기기" : "ℹ️ 정보 보기"}
          </button>
          <div className="inline-flex bg-gray-100 rounded-xl p-1 text-sm">
            <button
              onClick={() => setView("student")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${view === "student" ? "bg-white shadow-sm text-[#1E293B]" : "text-gray-500"}`}
            >
              학생 시점
            </button>
            <button
              onClick={() => setView("teacher")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${view === "teacher" ? "bg-white shadow-sm text-[#1E293B]" : "text-gray-500"}`}
            >
              교사 시점
            </button>
          </div>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noteFrontPriority}
              onChange={(e) => setNoteFrontPriority(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span>요주의 학생 앞자리 우선</span>
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowEditor(true)}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              👥 학생 명단 편집
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium"
            >
              🖨️ 인쇄
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <label className="text-xs text-gray-500 font-medium mb-1 block">
              추가 요청사항 (자연어로 자유롭게 — AI가 해석해서 반영)
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder={`예) 강지원과 박기민은 떨어뜨려줘. 전태준은 맨 앞자리에. 박하임이랑 조성재는 같은 모둠 X. 학습부진끼리는 떨어뜨려줘.`}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              ※ &lsquo;자리 정하기&rsquo; 버튼을 누르면 요청을 해석한 후 배치됩니다. 비워두면 그대로 자동 배치.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-medium block">교실 크기</label>
            <div className="flex items-center gap-2 text-sm">
              <input
                type="number"
                value={layout.cols}
                min={2}
                step={2}
                onChange={(e) => setLayout((l) => ({ ...l, cols: Math.max(2, parseInt(e.target.value || "0", 10)) }))}
                className="w-16 border rounded px-2 py-1"
              />
              <span>열 ×</span>
              <input
                type="number"
                value={layout.rows}
                min={2}
                step={2}
                onChange={(e) => setLayout((l) => ({ ...l, rows: Math.max(2, parseInt(e.target.value || "0", 10)) }))}
                className="w-16 border rounded px-2 py-1"
              />
              <span>행</span>
            </div>
            <ConstraintSummary constraints={parsedConstraints} students={students} />
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* 교실 */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6 print:shadow-none print:border-0">
          {/* 칠판/교탁 — view 에 따라 위/아래 */}
          {view === "student" && <BlackboardBar />}

          <div
            className="grid gap-2 sm:gap-3 my-4 sm:my-6"
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
            }}
          >
            {orderedSeats.map((seat) => {
              const student = seat.studentId != null ? studentMap.get(seat.studentId) : null;
              const isFrontRow = seat.row < layout.rows / 2;
              return (
                <DroppableSeat key={seat.idx} seatIdx={seat.idx} highlight={isFrontRow}>
                  {student ? (
                    <DraggableCard
                      seatIdx={seat.idx}
                      student={student}
                      showInfo={showInfo}
                      flipped={seatFlipped}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">빈자리</div>
                  )}
                </DroppableSeat>
              );
            })}
          </div>

          {view === "teacher" && <BlackboardBar label="교탁 (교사 시점)" />}
        </div>
      </DndContext>

      {/* 모둠 합계 */}
      {arrangement && (
        <div className="print:hidden mt-4 text-xs text-gray-500 text-center">
          배치 점수: {arrangement.score} · 드래그 앤 드롭으로 두 학생을 맞바꿀 수 있습니다.
        </div>
      )}

      {showEditor && (
        <StudentEditor students={students} setStudents={setStudents} onClose={() => setShowEditor(false)} />
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body {
            background: white !important;
          }
          header, footer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function BlackboardBar({ label = "칠판" }: { label?: string }) {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-xl bg-gradient-to-b from-emerald-700 to-emerald-800 text-white rounded-xl py-2.5 text-center text-sm font-semibold tracking-widest shadow-inner">
        {label}
      </div>
    </div>
  );
}
