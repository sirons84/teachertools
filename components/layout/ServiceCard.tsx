import Link from "next/link";
import type { ServiceItem } from "@/constants/services";

const COLOR_MAP: Record<string, { card: string; badge: string; btn: string }> = {
  blue:   { card: "border-blue-200 hover:border-blue-400 hover:shadow-blue-100",   badge: "bg-blue-100 text-blue-700",   btn: "bg-blue-600 hover:bg-blue-700 text-white" },
  green:  { card: "border-green-200 hover:border-green-400 hover:shadow-green-100", badge: "bg-green-100 text-green-700", btn: "bg-green-600 hover:bg-green-700 text-white" },
  purple: { card: "border-purple-200",                                              badge: "bg-purple-100 text-purple-700", btn: "" },
  orange: { card: "border-orange-200",                                              badge: "bg-orange-100 text-orange-700", btn: "" },
};

interface Props {
  service: ServiceItem;
}

export default function ServiceCard({ service }: Props) {
  const colors = COLOR_MAP[service.color] ?? COLOR_MAP.blue;
  const isActive = service.status === "active";

  const cardContent = (
    <div
      className={`
        relative bg-white rounded-2xl border-2 p-6 flex flex-col gap-3 h-full
        transition-all duration-200
        ${isActive ? `${colors.card} shadow-sm hover:shadow-lg cursor-pointer` : "border-gray-200 opacity-60 cursor-not-allowed"}
      `}
    >
      {!isActive && (
        <span className="absolute top-4 right-4 text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          준비중
        </span>
      )}

      <div className="text-4xl">{service.icon}</div>

      <div>
        <h3 className="font-bold text-lg text-[#1E293B] leading-snug">
          {service.title}
        </h3>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          {service.description}
        </p>
      </div>

      {isActive && (
        <div className="mt-auto pt-2">
          <span
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${colors.btn}`}
          >
            시작하기 <span>→</span>
          </span>
        </div>
      )}
    </div>
  );

  if (isActive) {
    return <Link href={service.href} className="block h-full">{cardContent}</Link>;
  }

  return <div className="h-full">{cardContent}</div>;
}
