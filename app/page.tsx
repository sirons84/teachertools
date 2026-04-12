import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceCard from "@/components/layout/ServiceCard";
import { SERVICES } from "@/constants/services";

export const metadata: Metadata = {
  title: "티처툴즈 (TeacherTools) — 선생님을 위한 스마트 도구 모음",
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12">
        {/* Hero */}
        <section className="text-center mb-12">
          <div className="text-6xl mb-4">🏫</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1E293B] mb-3">
            티처툴즈
          </h1>
          <p className="text-lg text-gray-500">
            선생님을 위한 스마트 도구 모음
          </p>
        </section>

        {/* Service grid */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
