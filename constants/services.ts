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
    id: "report-helper",
    title: "생활기록부 도우미",
    description: "AI가 학생 특성에 맞는 생활기록부 문구를 추천합니다.",
    icon: "📝",
    href: "/services/report-helper",
    status: "coming-soon",
    color: "orange",
  },
];
