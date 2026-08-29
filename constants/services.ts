export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  external?: boolean;
  status: "active" | "coming-soon";
  color: string;
}

export const SERVICES: ServiceItem[] = [
  {
    id: "sotongmun",
    title: "가정통신문 다국어 서비스",
    description:
      "가정통신문을 업로드하면 다국어 웹페이지와 QR코드가 자동 생성됩니다. 다문화 가정 학부모가 모국어로 읽고 AI 채팅으로 질문할 수 있습니다.",
    icon: "📄",
    href: "/services/sotongmun",
    status: "active",
    color: "blue",
  },
  {
    id: "question-class",
    title: "질문있는 교실",
    description: "학생들이 자유롭게 질문하고 함께 답을 찾아가는 참여형 수업 도구입니다.",
    icon: "🙋",
    href: "https://ulsan.it/",
    external: true,
    status: "active",
    color: "purple",
  },
  {
    id: "debate",
    title: "AI 토론 수업 설계",
    description: "수업 주제 한 줄을 입력하면 AI가 학습문제 제안 → 지도안 설계 → 토론 시뮬레이션 → 관찰·평가 → 생기부 초안까지 6단계를 자동으로 생성합니다.",
    icon: "🗣️",
    href: "/debate/new",
    status: "active",
    color: "indigo",
  },
  {
    id: "classmate",
    title: "ClassMate AI",
    description:
      "수업용 AI 친구 — 학생이 질문/토론/글쓰기 피드백/아이디어/복습/영어회화 에이전트를 선택해 바로 대화합니다. (글쓰기 피드백은 구글 로그인 필요)",
    icon: "🎒",
    href: "/classmate",
    status: "active",
    color: "indigo",
  },
  {
    id: "padlet",
    title: "포스트잇 협업 보드",
    description:
      "교사가 주제별 보드를 만들고, 학생/학부모가 닉네임만 입력해 텍스트·이미지·파일·링크를 포스트잇처럼 올리고 댓글·이모지로 반응합니다.",
    icon: "📌",
    href: "/services/padlet",
    status: "active",
    color: "teal",
  },
  {
    id: "seat-arrangement",
    title: "스마트 자리 배치",
    description:
      "성적·성별·특이사항을 고려해 4인 1조 균형 모둠을 자동 배치합니다. 드래그 앤 드롭으로 손쉽게 수정하고, 자연어로 추가 요청사항을 입력하면 AI가 해석해 반영합니다.",
    icon: "🪑",
    href: "/services/seat-arrangement",
    status: "active",
    color: "indigo",
  },
  {
    id: "nuga",
    title: "음성 누가기록",
    description:
      "수업 중 “7번, 친구 의견을 먼저 정리해 줌”이라고 말하면 해당 학생 칸에 오늘 날짜와 함께 기록이 쌓입니다. 번호는 자동 인식, 저장 전 수정 가능, CSV 내보내기까지.",
    icon: "🎙️",
    href: "/services/nuga",
    status: "active",
    color: "rose",
  },
  {
    id: "report-helper",
    title: "생활기록부 도우미",
    description: "AI가 학생 특성에 맞는 생활기록부 문구를 추천합니다.",
    icon: "📝",
    href: "/services/report-helper",
    status: "coming-soon",
    color: "orange",
  },
];
