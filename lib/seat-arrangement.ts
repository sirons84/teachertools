export type Gender = "남" | "여";

export type Student = {
  id: number;
  name: string;
  num: number;
  gender: Gender;
  rank: number;
  note: string;
};

export type Seat = {
  row: number;
  col: number;
  studentId: number | null;
};

export type GroupId = number;

export type Constraints = {
  separate?: Array<[number, number]>;
  pair?: Array<[number, number]>;
  front?: number[];
  back?: number[];
  avoidGroup?: Array<[number, number]>;
  groupTogether?: Array<[number, number]>;
};

export type ArrangeOptions = {
  rows: number;
  cols: number;
  noteFrontPriority: boolean;
  constraints?: Constraints;
  attempts?: number;
};

export type Arrangement = {
  seats: Seat[];
  groupOfSeat: Map<string, GroupId>;
  score: number;
};

const NOTE_KEYWORDS = ["산만", "행동", "학습부진"];

export function isAttentionStudent(s: Student): boolean {
  if (!s.note) return false;
  return NOTE_KEYWORDS.some((k) => s.note.includes(k));
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function seatKey(row: number, col: number) {
  return `${row},${col}`;
}

/**
 * 4인 1조 성적 균형 모둠 후보 풀 생성.
 * - 매번 다른 쌍이 나오도록 랜덤 파티셔닝
 * - 6개 모둠의 성적(rank) 합 편차(max-min)가 최소에 가까운 후보들만 풀로 채택
 * - 각 모둠 내부는 [남 상위, 남 하위, 여 상위, 여 하위] 순으로 정렬 → 지그재그 호환
 *
 * @param tolerance min_spread + tolerance 이내인 후보만 풀에 포함 (기본 2)
 * @param samples   랜덤 샘플 시도 횟수
 * @param maxPool   풀 최대 크기
 */
export function generateBalancedGroupPool(
  students: Student[],
  opts: { samples?: number; tolerance?: number; maxPool?: number } = {}
): Student[][][] {
  const samples = opts.samples ?? 3000;
  const tolerance = opts.tolerance ?? 2;
  const maxPool = opts.maxPool ?? 400;

  const boys = students.filter((s) => s.gender === "남");
  const girls = students.filter((s) => s.gender === "여");
  const groupCount = Math.min(Math.floor(boys.length / 2), Math.floor(girls.length / 2));
  if (groupCount === 0) return [];

  type Sample = { groups: Student[][]; spread: number };
  const all: Sample[] = [];

  for (let t = 0; t < samples; t++) {
    const sb = shuffle(boys);
    const sg = shuffle(girls);
    const groups: Student[][] = [];
    let minSum = Infinity;
    let maxSum = -Infinity;
    for (let g = 0; g < groupCount; g++) {
      const b1 = sb[g * 2];
      const b2 = sb[g * 2 + 1];
      const g1 = sg[g * 2];
      const g2 = sg[g * 2 + 1];
      const bTop = b1.rank <= b2.rank ? b1 : b2;
      const bBot = b1.rank <= b2.rank ? b2 : b1;
      const gTop = g1.rank <= g2.rank ? g1 : g2;
      const gBot = g1.rank <= g2.rank ? g2 : g1;
      groups.push([bTop, bBot, gTop, gBot]);
      const sum = b1.rank + b2.rank + g1.rank + g2.rank;
      if (sum < minSum) minSum = sum;
      if (sum > maxSum) maxSum = sum;
    }
    all.push({ groups, spread: maxSum - minSum });
  }

  all.sort((a, b) => a.spread - b.spread);
  const minSpread = all[0].spread;
  const accepted = all.filter((s) => s.spread <= minSpread + tolerance);
  return accepted.slice(0, maxPool).map((s) => s.groups);
}

/** 모둠별 rank 합 — 디버깅/표시용 */
export function groupRankSums(groups: Student[][]): number[] {
  return groups.map((g) => g.reduce((acc, s) => acc + s.rank, 0));
}

/**
 * 4명짜리 한 모둠을 2x2 배치 (지그재그).
 * 인접(가로/세로)은 이성, 대각선은 동성 + 상위/하위 마주봄.
 *
 * 입력: [boyTop, boyBot, girlTop, girlBot]
 *
 * 4가지 변형:
 *  - 좌상이 남/여 (orientation)
 *  - 상단 남이 위/아래 (boyFlip)
 */
function placeGroup4(
  group: Student[],
  variant: number
): { positions: Student[]; /* 0..3, row-major */ } {
  const [bT, bB, gT, gB] = group;
  const orientation = variant & 1; // 0: 좌상 남, 1: 좌상 여
  const boyDiagSwap = (variant >> 1) & 1; // 대각선 위치 스왑
  const girlDiagSwap = (variant >> 2) & 1;

  // 패턴 A (orientation=0):
  //   B*  G*
  //   G*  B*
  // 패턴 B (orientation=1):
  //   G*  B*
  //   B*  G*
  const boyA = boyDiagSwap ? bB : bT; // 좌상 또는 우상 위치의 남
  const boyB = boyDiagSwap ? bT : bB;
  const girlA = girlDiagSwap ? gB : gT;
  const girlB = girlDiagSwap ? gT : gB;

  if (orientation === 0) {
    return { positions: [boyA, girlA, girlB, boyB] };
  } else {
    return { positions: [girlA, boyA, boyB, girlB] };
  }
}

/** 전체 좌석 배치 — 모둠 그리드(2 group cols x 3 group rows = 6 groups, seats=4x6).
 *  user spec: "4열 x 6행 (앞 3모둠, 뒤 3모둠)" → 3 group cols x 2 group rows (seats 6x4)
 *  이 두 형태를 옵션 rows/cols 로 받아 처리.
 *
 *  cols = group cols * 2
 *  rows = group rows * 2
 */
type Layout = { groupRows: number; groupCols: number; rows: number; cols: number };

function deriveLayout(rows: number, cols: number): Layout {
  return { groupRows: Math.floor(rows / 2), groupCols: Math.floor(cols / 2), rows, cols };
}

function seatsForGroupSlot(gRow: number, gCol: number): Array<[number, number]> {
  // row-major 2x2: [TL, TR, BL, BR]
  const r0 = gRow * 2;
  const c0 = gCol * 2;
  return [
    [r0, c0],
    [r0, c0 + 1],
    [r0 + 1, c0],
    [r0 + 1, c0 + 1],
  ];
}

function buildArrangement(
  students: Student[],
  groupOrder: Student[][], // 모둠 그리드에 채울 순서 (groupRows * groupCols)
  variants: number[],
  layout: Layout
): Arrangement {
  const seats: Seat[] = [];
  const groupOfSeat = new Map<string, GroupId>();
  let groupIdx = 0;
  for (let gr = 0; gr < layout.groupRows; gr++) {
    for (let gc = 0; gc < layout.groupCols; gc++) {
      const group = groupOrder[groupIdx];
      const variant = variants[groupIdx];
      const placed = placeGroup4(group, variant).positions;
      const slot = seatsForGroupSlot(gr, gc);
      for (let i = 0; i < 4; i++) {
        const [row, col] = slot[i];
        seats.push({ row, col, studentId: placed[i].id });
        groupOfSeat.set(seatKey(row, col), groupIdx);
      }
      groupIdx++;
    }
  }
  // 남은 좌석 (그룹 부족 시) — 빈자리
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      if (!seats.some((s) => s.row === r && s.col === c)) {
        seats.push({ row: r, col: c, studentId: null });
      }
    }
  }
  return { seats, groupOfSeat, score: 0 };
}

function isAdjacent(a: Seat, b: Seat): boolean {
  // 가로/세로/대각선 1칸 이내
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1 && !(a.row === b.row && a.col === b.col);
}

function isOrthogonalAdjacent(a: Seat, b: Seat): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

function evaluate(
  arr: Arrangement,
  layout: Layout,
  constraints: Constraints | undefined,
  noteStudentIds: Set<number>,
  noteFrontPriority: boolean
): number {
  let score = 0;
  const byStudent = new Map<number, Seat>();
  for (const s of arr.seats) if (s.studentId != null) byStudent.set(s.studentId, s);

  // 요주의 학생이 속한 모둠을 앞쪽(group row 0)에 배치할수록 가산
  if (noteFrontPriority) {
    for (const id of noteStudentIds) {
      const seat = byStudent.get(id);
      if (!seat) continue;
      // group row 인덱스 = floor(row/2)
      const gr = Math.floor(seat.row / 2);
      // 앞쪽일수록 점수 ↑ (groupRows-1 - gr)
      score += (layout.groupRows - 1 - gr) * 8;
    }
  }

  if (!constraints) return score;

  for (const [a, b] of constraints.separate ?? []) {
    const sa = byStudent.get(a);
    const sb = byStudent.get(b);
    if (!sa || !sb) continue;
    if (isAdjacent(sa, sb)) score -= 120;
    // 거리가 멀수록 약한 보너스
    const dist = Math.abs(sa.row - sb.row) + Math.abs(sa.col - sb.col);
    score += Math.min(dist, 6);
  }

  for (const [a, b] of constraints.pair ?? []) {
    const sa = byStudent.get(a);
    const sb = byStudent.get(b);
    if (!sa || !sb) continue;
    if (isOrthogonalAdjacent(sa, sb)) score += 80;
    else score -= 40;
  }

  for (const id of constraints.front ?? []) {
    const s = byStudent.get(id);
    if (!s) continue;
    // 맨 앞 행에 가까울수록 점수 ↑
    score += (layout.rows - 1 - s.row) * 15;
    if (s.row === 0) score += 30;
  }

  for (const id of constraints.back ?? []) {
    const s = byStudent.get(id);
    if (!s) continue;
    score += s.row * 15;
    if (s.row === layout.rows - 1) score += 30;
  }

  for (const [a, b] of constraints.avoidGroup ?? []) {
    const sa = byStudent.get(a);
    const sb = byStudent.get(b);
    if (!sa || !sb) continue;
    const ga = arr.groupOfSeat.get(seatKey(sa.row, sa.col));
    const gb = arr.groupOfSeat.get(seatKey(sb.row, sb.col));
    if (ga != null && gb != null && ga === gb) score -= 100;
    else score += 10;
  }

  for (const [a, b] of constraints.groupTogether ?? []) {
    const sa = byStudent.get(a);
    const sb = byStudent.get(b);
    if (!sa || !sb) continue;
    const ga = arr.groupOfSeat.get(seatKey(sa.row, sa.col));
    const gb = arr.groupOfSeat.get(seatKey(sb.row, sb.col));
    if (ga != null && gb != null && ga === gb) score += 60;
    else score -= 30;
  }

  return score;
}

/** 모둠 순서 정렬 — 요주의 토글이 켜져 있으면 note 많은 모둠을 앞쪽 group row 에 배치. */
function orderGroups(groups: Student[][], layout: Layout, noteFrontPriority: boolean): Student[][] {
  const indexed = groups.map((g, i) => ({ g, i, noteCount: g.filter(isAttentionStudent).length }));
  if (noteFrontPriority) {
    // note 많은 모둠 → 앞쪽
    // 앞쪽 group row 의 슬롯 수만큼 우선 채움 + 그 안에서는 셔플
    const totalSlots = layout.groupRows * layout.groupCols;
    const sorted = indexed.slice().sort((a, b) => b.noteCount - a.noteCount);
    // 약한 확률성 가미: 같은 noteCount 내에서는 셔플
    const buckets = new Map<number, typeof indexed>();
    for (const item of sorted) {
      const arr = buckets.get(item.noteCount) ?? [];
      arr.push(item);
      buckets.set(item.noteCount, arr);
    }
    const keys = Array.from(buckets.keys()).sort((a, b) => b - a);
    const out: typeof indexed = [];
    for (const k of keys) out.push(...shuffle(buckets.get(k)!));
    return out.slice(0, totalSlots).map((x) => x.g);
  }
  return shuffle(groups);
}

export function arrangeSeats(
  students: Student[],
  options: ArrangeOptions
): Arrangement {
  const layout = deriveLayout(options.rows, options.cols);
  const noteIds = new Set(students.filter(isAttentionStudent).map((s) => s.id));
  const attempts = options.attempts ?? 800;

  // 매번 다른 짝이 나오도록 균형 잡힌 모둠 후보 풀을 새로 생성
  const pool = generateBalancedGroupPool(students, {
    samples: 3000,
    tolerance: 2,
    maxPool: 400,
  });
  if (!pool.length) {
    return { seats: [], groupOfSeat: new Map(), score: 0 };
  }

  let best: Arrangement | null = null;

  for (let t = 0; t < attempts; t++) {
    const baseGroups = pool[Math.floor(Math.random() * pool.length)];
    const ordered = orderGroups(baseGroups, layout, options.noteFrontPriority);
    const variants = ordered.map(() => Math.floor(Math.random() * 8));
    const arr = buildArrangement(students, ordered, variants, layout);
    arr.score = evaluate(arr, layout, options.constraints, noteIds, options.noteFrontPriority);
    if (!best || arr.score > best.score) best = arr;
  }

  return best!;
}

export function swapSeats(seats: Seat[], aIdx: number, bIdx: number): Seat[] {
  const next = seats.map((s) => ({ ...s }));
  const tmp = next[aIdx].studentId;
  next[aIdx].studentId = next[bIdx].studentId;
  next[bIdx].studentId = tmp;
  return next;
}

export const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: "강지원", num: 1, gender: "남", rank: 2, note: "" },
  { id: 2, name: "박기민", num: 4, gender: "남", rank: 11, note: "산만" },
  { id: 3, name: "정세윤", num: 9, gender: "남", rank: 9, note: "학습부진" },
  { id: 4, name: "한승혁", num: 12, gender: "남", rank: 7, note: "" },
  { id: 5, name: "조아령", num: 11, gender: "남", rank: 7, note: "다문화" },
  { id: 6, name: "윤수민", num: 6, gender: "남", rank: 5, note: "" },
  { id: 7, name: "김시후", num: 3, gender: "남", rank: 4, note: "" },
  { id: 8, name: "박하임", num: 5, gender: "남", rank: 11, note: "별2개, 행동" },
  { id: 9, name: "김서진", num: 2, gender: "남", rank: 3, note: "" },
  { id: 10, name: "조성재", num: 10, gender: "남", rank: 10, note: "별2개, 행동" },
  { id: 11, name: "윤지호", num: 7, gender: "남", rank: 2, note: "" },
  { id: 12, name: "전태준", num: 8, gender: "남", rank: 9, note: "별1개, 행동" },
  { id: 13, name: "이주하", num: 19, gender: "여", rank: 7, note: "" },
  { id: 14, name: "이소미", num: 18, gender: "여", rank: 6, note: "" },
  { id: 15, name: "최은채", num: 23, gender: "여", rank: 13, note: "학습부진" },
  { id: 16, name: "김소희", num: 13, gender: "여", rank: 4, note: "" },
  { id: 17, name: "김혜영", num: 16, gender: "여", rank: 12, note: "" },
  { id: 18, name: "김은지", num: 14, gender: "여", rank: 4, note: "" },
  { id: 19, name: "이하민", num: 20, gender: "여", rank: 11, note: "" },
  { id: 20, name: "이효주", num: 21, gender: "여", rank: 3, note: "" },
  { id: 21, name: "신서윤", num: 17, gender: "여", rank: 11, note: "" },
  { id: 22, name: "김지수", num: 15, gender: "여", rank: 2, note: "" },
  { id: 23, name: "한채원", num: 24, gender: "여", rank: 9, note: "" },
  { id: 24, name: "조윤슬", num: 22, gender: "여", rank: 1, note: "" },
];
