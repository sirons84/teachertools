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
    id: "economy-class",
    title: "단단반 경제교실",
    description: "학생들이 직접 경험하는 경제 교육 플랫폼입니다. 실생활 경제 개념을 재미있게 배울 수 있습니다.",
    icon: "💰",
    href: "https://tax-ashy.vercel.app/",
    external: true,
    status: "active",
    color: "green",
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
    id: "hangeul",
    title: "한글 자음·모음 배우기",
    description: "자음 14개, 모음 21개를 카드로 익히고 발음을 들어볼 수 있습니다. 특수학생·초등 저학년에 적합한 한글 기초 학습 도구입니다.",
    icon: "가",
    href: "/services/hangeul",
    status: "active",
    color: "teal",
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
