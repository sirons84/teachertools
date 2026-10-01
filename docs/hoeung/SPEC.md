# 문장 호응 체크 (hoeung) — 개발 명세

> 클로드 코드 작업용 문서. 이 파일과 `items.json`만 읽으면 바로 구현 가능하도록 작성함.
> 프로젝트 공통 규칙은 루트 `CLAUDE.md`, `AGENTS.md`를 먼저 따른다.

## 0. 한 줄 요약

5학년 국어 「문장 성분의 호응 관계」 2차시(학부모 공개수업) 활동3용 개별 학습 웹앱.
학생은 개인 패드로 PART1→4를 순서대로 풀고, 교사는 대시보드에서 "지금 도움이 필요한 학생"을 보고 직접 찾아간다.
**채점 정확도가 목적이 아니다.** 교사가 갈 곳을 알려주고, 학생 옆에 가서 틀린 문제를 바로 같이 볼 수 있게 하는 것이 목적이다.

## 1. 수업 맥락 (설계 근거)

- 40분 수업: 도입 5분 / 활동1 교과서 5분 / 활동2 짝 말하기 15분 / **활동3 이 앱 10분** / 정리 5분
- 이번 차시 핵심: **서술어를 미리 정해 버리는 낱말과의 호응**
  - 결코·여간·도저히·별로·전혀·절대·그다지 → 부정하는 말
  - 반드시 → ~해야 한다 / 아마 → ~일 것이다 / 왜냐하면 → ~기 때문이다 / 만약 → ~ㄴ다면
  - 어제·내일 등 시간 표현 → 과거·미래 서술어
  - 선생님·할아버지 등 높임 대상 → ~께서 ~하셨다
- 목표: 보통 학생이 **10분 안에 PART3까지** 완료. PART4는 끝이 없는 "되는 만큼"
- AI 호출 없음. 외부 네트워크 의존은 DB 하나뿐. 공개수업 중 멈추면 안 된다.

## 2. 학생 흐름

### 입장 `/services/hoeung` (입장 URL은 하나. QR도 이 주소)
- 입력: 방 코드(4자리), 번호(1~40), 이름
- 번호와 이름을 함께 서버에 저장한다 (교사가 대시보드에서 학생을 바로 알아보기 위해). 단 TV 화면에는 절대 노출하지 않고, 「방 닫기」 시 모든 학생 데이터를 삭제한다
- 같은 방·번호로 다시 들어오면 어느 기기든 이어서 풀기 (서버 attempt를 내려받아 복원, localStorage `hoeung.session.v1`와 병합). 이름이 달라도 번호가 같으면 같은 학생으로 보고 이름만 최신으로 갱신
- 번호 중복 입장 시 경고 없이 이어서 풀기로 처리 (공개수업 중 막는 화면을 띄우지 않는다)

### 풀이 `/services/hoeung/play`
- 상단 고정: PART 탭(1~4) + **문항 점 띠(progress strip)**
  - 점 색: 회색(안 품) / 초록(맞음) / 주황(두 번 틀려 정답 봄) / 노랑(PART3 확인 필요) / 파랑(현재)
  - **점을 누르면 그 문제로 즉시 이동.** 이것이 핵심 UX. 교사가 학생 옆에 와서 "3번 다시 보자" 하면 한 번 탭으로 간다
- 되돌아간 문제 화면: 학생이 낸 답 + 정답 + 힌트 한 줄을 모두 보여준다 (다시 풀기 가능)
- 되돌아간 문제 화면 하단에 **「선생님과 확인했어요 ✔」 버튼**. 누르면 해당 문항 `checked=true`로 저장 → 교사 대시보드에서 그 학생의 경고 표시가 사라진다 (교사가 도와준 뒤 학생 패드에서 한 번 눌러 주는 용도)
- 틀렸을 때 절대 막지 않는다:
  1. 1차 오답 → 힌트 한 줄 표시, 재도전
  2. 2차 오답 → 정답 공개, 「다음」 활성화 (상태 주황)
- PART 전환: PART의 모든 문항을 한 번씩 지나가면 다음 PART 열림. 이전 PART는 언제든 탭으로 복귀
- 모든 입력은 즉시 `localStorage`에 반영 → 서버 전송은 fire-and-forget + 실패 시 큐에 쌓아 재전송 (`navigator.onLine` 복귀 시 flush). 패드 와이파이가 흔들려도 학생은 계속 푼다
- 마지막 활동 시각(`lastActiveAt`)과 현재 문항(`currentItemId`)을 15초 간격 heartbeat로 전송 (풀이 중일 때만)

### PART별 상호작용

| PART | 제목 | 입력 방식 | 판정 | 문항 수 | 예상 소요 |
|---|---|---|---|---|---|
| 1 | 틀린 곳 찾기 | 문장을 **어절 칩**으로 나열, 틀린 어절을 탭 | 정답 어절 인덱스 일치 | 6 | 15~20초/문항 |
| 2 | 알맞은 낱말 고르기 | 빈칸 문장 + 4지선다 버튼 | 정답 인덱스 일치 | 6 | 20초/문항 |
| 3 | 문장 고치기 | 틀린 부분만 빈칸, **그 자리만 타자** | 정규식 1차 판정 → 통과 `ok` / 미통과 `needs-check` (오답 아님, 막지 않음) | 5 | 45초~1분/문항 |
| 4 | 문장 만들기 | 낱말 두 개 제시, 자유 입력 한 줄 | **채점 없음**, 제출만 | 10 | 제한 없음 |

- PART3의 `needs-check`는 "앱이 모르겠다"는 뜻. 학생에게는 "선생님이 확인해 줄 거예요"로 표시하고 다음으로 넘어가게 한다
- PART4는 제출 즉시 다음 문항. 교사 대시보드에서 전문 열람
- 타자 부담 줄이기: PART3·4 입력창은 `enterKeyHint="done"`, 자동완성 off, 글자 크기 20px 이상

## 3. 교사 흐름

### 방 만들기 `/services/hoeung/teacher`
- 버튼 하나: 「새 방 만들기」 → 4자리 코드 생성 (혼동 글자 제외: 0/O/1/I 제거) + `teacherKey`(nanoid 16)
- 교사 URL: `/services/hoeung/teacher/[code]?k=[teacherKey]` → 쿠키에 저장해 이후 `?k` 없이 접근 가능
- 별도 비밀번호 로그인 없음 (padlet admin 비밀번호 재사용하지 않는다. 수업 직전에 교사 패드에서 바로 만들 수 있어야 함)
- 방 화면에 학생 입장용 큰 코드 + QR (`qrcode` 이미 의존성 있음). QR은 `/services/hoeung`을 가리키고 학생이 코드를 입력한다

### 대시보드 `/services/hoeung/teacher/[code]`
- SWR 3초 폴링 (padlet BoardClient 패턴 그대로)
- **격자: 행 = 학생(번호순), 열 = PART1~4.** 셀 = 해당 PART 문항 점 띠의 축약(맞음/틀림/확인필요 개수)
- 행 맨 앞에 **상태 뱃지** (우선순위 순, 하나만 표시):
  1. 🔴 `STUCK` : 같은 문항에서 120초 이상 (lastActiveAt 기준, 현재 문항 변화 없음)
  2. 🟠 `WRONG2` : 두 번 틀려 정답 본 문항이 있고 아직 `checked=false`
  3. 🟡 `CHECK` : PART3 `needs-check` 문항이 있고 `checked=false`
  4. ⚪ `IDLE` : 60초 이상 heartbeat 없음 (패드 꺼짐/이탈)
  5. 🟢 정상
- 정렬: 뱃지 우선순위 → 번호. 즉 **맨 위 학생이 지금 가야 할 학생**
- 학생 행 클릭 → 우측 패널에 그 학생의 전체 문항 상세 (낸 답/정답/시도 횟수/시각). PART4 제출문은 여기서 읽는다
- 상단 요약: PART별 완료 인원 막대, 전체 평균 진행 문항, 문항별 오답률 Top3 (활동1 설명이 부족했던 지점 파악용)
- 버튼: 「TV 화면 열기」 / 「CSV 내보내기」 / 「방 닫기(삭제)」

### TV 화면 `/services/hoeung/teacher/[code]/tv`
- **익명.** 학생 번호·이름 없음
- PART별 반 전체 진행 막대 + 현재 각 PART에 있는 인원 수 + 큰 방 코드
- 10초 폴링, 큰 글씨, 흰 배경 (교실 TV 가독성)

## 4. 데이터

### 문항 (`data/hoeung-items.json`)
- `docs/hoeung/items.json`을 `data/`로 옮겨 사용. 교사가 직접 수정할 수 있도록 **코드가 아닌 JSON**으로 둔다
- 스키마는 items.json 상단 `_schema` 참고. DB에는 넣지 않는다 (문항 수정 시 배포만)

### Prisma 모델 (schema.prisma에 추가, `pnpm db:push`)

```prisma
model HoeungRoom {
  id         String   @id @default(cuid())
  code       String   @unique          // 4자리, 대문자
  teacherKey String                    // nanoid(16)
  title      String   @default("문장 호응 체크")
  isClosed   Boolean  @default(false)
  createdAt  DateTime @default(now())
  students   HoeungStudent[]
  @@index([isClosed, createdAt])
}

model HoeungStudent {
  id            String   @id @default(cuid())
  roomId        String
  room          HoeungRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  number        Int
  name          String                 // 입장 시 입력. TV 화면에는 노출 금지, 방 삭제 시 함께 삭제
  currentItemId String?
  lastActiveAt  DateTime @default(now())
  createdAt     DateTime @default(now())
  attempts      HoeungAttempt[]
  @@unique([roomId, number])
}

model HoeungAttempt {
  id         String   @id @default(cuid())
  studentId  String
  student    HoeungStudent @relation(fields: [studentId], references: [id], onDelete: Cascade)
  itemId     String                    // items.json의 id (예: "p1-03")
  part       Int                       // 1~4
  answer     String   @db.Text         // 학생 입력(인덱스 또는 텍스트)
  status     String                    // "correct" | "wrong" | "revealed" | "ok" | "needs-check" | "submitted"
  tries      Int      @default(1)
  checked    Boolean  @default(false)  // 「선생님과 확인했어요」
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@unique([studentId, itemId])        // 문항당 한 행, 재시도는 upsert로 tries 증가
  @@index([studentId, part])
}
```

### API (`app/api/hoeung/...`)

| Method | Path | 용도 | 인증 |
|---|---|---|---|
| POST | `/rooms` | 방 생성 → `{code, teacherKey}` | 없음 |
| POST | `/rooms/[code]/join` | `{number, name}` → student 생성/복원(upsert on roomId+number, name 갱신), `{studentId, attempts[]}` | 없음 |
| POST | `/students/[studentId]/attempts` | upsert attempt `{itemId, part, answer, status}` | studentId 자체가 토큰 역할 (cuid) |
| PATCH | `/students/[studentId]/attempts/[itemId]` | `{checked: true}` | 동일 |
| POST | `/students/[studentId]/heartbeat` | `{currentItemId}` | 동일 |
| GET | `/rooms/[code]/dashboard` | 전체 학생+attempt 집계 | `teacherKey` (쿠키 또는 `?k`) |
| GET | `/rooms/[code]/tv` | 익명 집계만 | 없음 (코드 알면 열람 가능, 익명이므로 허용) |
| GET | `/rooms/[code]/export.csv` | 번호,이름,PART,문항,답,상태,시도,확인 | teacherKey |
| DELETE | `/rooms/[code]` | 방과 모든 데이터 삭제 | teacherKey |

- 판정(정답 비교, 정규식)은 **클라이언트에서** 수행하고 결과 status를 보낸다. 서버는 저장만 한다 (네트워크 끊겨도 학생 화면은 동작해야 하므로)
- 대시보드 응답에서 뱃지 계산은 서버에서 한 번에 (lastActiveAt, currentItemId, attempts로 산출)

## 5. 파일 배치 (기존 구조 준수)

```
app/services/hoeung/page.tsx                 입장(코드·번호·이름)
app/services/hoeung/play/PlayClient.tsx      풀이 화면 (client)
app/services/hoeung/play/page.tsx
app/services/hoeung/teacher/page.tsx         방 만들기
app/services/hoeung/teacher/[code]/page.tsx  대시보드 (DashboardClient.tsx)
app/services/hoeung/teacher/[code]/tv/page.tsx
app/api/hoeung/...                           위 표
components/hoeung/
  ProgressStrip.tsx     문항 점 띠 (탭 이동)
  PartTabs.tsx
  Part1Chips.tsx        어절 칩
  Part2Choice.tsx
  Part3Blank.tsx
  Part4Free.tsx
  StudentRow.tsx        대시보드 행 + 뱃지
  StudentDetail.tsx     우측 상세 패널
lib/hoeung/
  items.ts              JSON 로드 + 타입
  judge.ts              PART별 판정 함수 (순수 함수, 테스트 가능)
  store.ts              localStorage + 전송 큐 (nuga-store.ts의 useSyncExternalStore 패턴 재사용)
  badge.ts              뱃지 산출 (서버·클라이언트 공용)
  code.ts               방 코드 생성 (혼동 글자 제외)
data/hoeung-items.json
constants/services.ts   SERVICES에 항목 추가 (id: "hoeung", icon "✏️", href "/services/hoeung", color "amber")
```

## 6. UI 톤

- 학생 화면: 패드 세로/가로 모두. 버튼 최소 높이 56px, 본문 22px 이상. 한 화면에 문항 하나
- 색은 상태 색 5가지(회/초록/주황/노랑/파랑)만 의미를 가진다. 나머지는 흰 배경 + 진회색 글자
- 피드백 문구는 짧게. 맞음 「좋아요!」 / 1차 오답 「힌트: …」 / 2차 「정답은 … 이에요. 다음에 또 만나요」
- 교사 대시보드: 데스크탑·패드. 뱃지 색만 눈에 띄고 나머지는 흐리게. 맨 위 행이 즉시 눈에 들어와야 함

## 7. 구현 순서 (권장)

1. `items.json` → `data/`, `lib/hoeung/items.ts` + `judge.ts` (판정 함수 먼저. 정규식 케이스 손으로 확인)
2. Prisma 모델 + `pnpm db:push` + API 전부
3. 학생 입장 → 풀이 화면 (ProgressStrip의 되돌아가기 + 「선생님과 확인했어요」까지)
4. 교사 방 만들기 → 대시보드 (뱃지 정렬) → 상세 패널
5. TV 화면, CSV, 방 삭제
6. 패드 2대 + 교사 PC로 실제 폴링 리허설. 와이파이 끈 상태에서 풀기 → 다시 켜면 동기화되는지 확인

## 8. 하지 않는 것

- AI/LLM 호출 (채점·힌트 모두 사전 작성 텍스트)
- 학생 이름을 TV 화면·CSV 외부 공유 외의 용도로 쓰는 것 (이름은 교사 대시보드 식별용으로만)
- 로그인/회원가입
- 타이머·순위·점수판 (경쟁 요소 없음. 이 활동은 '확인'이지 '시합'이 아님)
- PART4 자동 채점

## 9. 알려진 결정 사항 메모

- 활동지 원본 오타는 문항에서 교정함: 지난 주에→지난주에, 일이예요→일이에요, 안돼→안 돼, 우리반→우리 반
- 활동지 3-③ "회장이 문을 닫으셨다→닫았다"(높임 제거)는 다른 문항과 방향이 반대라 PART1에 넣고 힌트로 "높일 대상인지 먼저 생각"을 붙임
- PART3 정규식은 느슨하게. 틀린 걸 맞다고 할 위험보다 맞은 걸 "확인 필요"로 두는 쪽이 안전 (교사가 보면 됨)
