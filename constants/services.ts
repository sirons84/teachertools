export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
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
    id: "report-helper",
    title: "생활기록부 도우미",
    description: "AI가 학생 특성에 맞는 생활기록부 문구를 추천합니다.",
    icon: "📝",
    href: "/services/report-helper",
    status: "coming-soon",
    color: "green",
  },
  {
    id: "quiz-maker",
    title: "AI 문제 출제기",
    description: "교과서 내용을 바탕으로 AI가 다양한 형태의 문제를 자동 출제합니다.",
    icon: "🧩",
    href: "/services/quiz-maker",
    status: "coming-soon",
    color: "purple",
  },
  {
    id: "lesson-planner",
    title: "수업계획서 도우미",
    description: "교육과정에 맞는 수업계획서를 AI와 함께 손쉽게 작성합니다.",
    icon: "📅",
    href: "/services/lesson-planner",
    status: "coming-soon",
    color: "orange",
  },
];
