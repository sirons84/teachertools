import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "티처툴즈 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <article className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 sm:px-10 py-8 leading-relaxed text-[#334155]">
          <h1 className="text-2xl font-bold text-[#1E293B] pb-4 mb-6 border-b border-gray-200">
            티처툴즈 개인정보처리방침
          </h1>
          <p className="text-sm font-semibold text-gray-500 mb-4">
            시행일: 2026년 7월 7일
          </p>
          <p className="text-[#475569] mb-8">
            티처툴즈(이하 &lsquo;서비스&rsquo;)는 「개인정보 보호법」 등 관계 법령을 준수하며,
            이용자의 개인정보를 안전하게 보호하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
            본 서비스는 초·중등 교사가 수업을 지원하기 위해 사용하는 도구 모음으로,
            개인정보를 최소한으로만 처리하는 것을 원칙으로 합니다.
          </p>

          <Section title="제1조 (수집하는 개인정보 항목)">
            <p>서비스는 각 기능 제공에 필요한 최소한의 정보만 수집하며, 수집 항목은 다음과 같습니다.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>구글 로그인 시</strong>(ClassMate AI 글쓰기 피드백 등 로그인이 필요한 일부 기능):
                이메일 주소, 이름, 프로필 이미지, 구글 계정 인증정보(OAuth 토큰)
              </li>
              <li>
                <strong>가정통신문 다국어 서비스</strong>: 교사가 업로드한 가정통신문 파일 및 그 내용,
                자동 생성된 번역·설명, 학부모가 입력한 채팅 질문 내용
              </li>
              <li>
                <strong>ClassMate AI · AI 토론 수업 설계</strong>: 이용자가 입력한 대화·토론 내용,
                토론 주제·학년·교과, 기기 식별을 위한 브라우저 식별자(browserId)
              </li>
              <li>
                <strong>포스트잇 협업 보드</strong>: 이용자가 입력한 닉네임(가명),
                작성한 텍스트·이미지·파일·링크 카드 및 댓글
              </li>
              <li>
                <strong>스마트 자리 배치</strong>: 자리 배치를 위해 입력한 학생 이름·성별·성적·특이사항 등
                (아래 제3조에 따라 서버에 저장하지 않고 일시적으로만 처리)
              </li>
              <li>
                <strong>자동 수집 항목</strong>: 접속 IP 주소, 서비스 이용 기록 및 접속 로그
                (호스팅 사업자 차원에서 생성되는 정보)
              </li>
            </ul>
          </Section>

          <Section title="제2조 (개인정보의 수집·이용 목적)">
            <ul className="list-disc pl-5 space-y-1">
              <li>가정통신문의 다국어 번역·설명 제공 및 학부모 문의 응대(AI 채팅)</li>
              <li>AI 기반 학습·수업 지원(토론 설계, 글쓰기 피드백, 대화형 학습 등) 제공</li>
              <li>협업 보드 운영(카드·댓글 게시 및 상호작용)</li>
              <li>로그인이 필요한 기능의 회원 인증 및 본인 식별</li>
              <li>서비스 이용 통계 분석, 품질 개선 및 오·남용 방지</li>
            </ul>
          </Section>

          <Section title="제3조 (개인정보의 최소 수집 원칙)">
            <p>
              서비스는 처리 목적 달성에 필요한 최소한의 정보만 수집합니다. 학생이 이용하는 기능은
              원칙적으로 실명·생년월일·연락처 등 개인을 직접 식별하는 정보의 입력을 요구하지 않으며,
              교사가 학급 단위로 운영하는 방식으로 제공됩니다. 특히 <strong>스마트 자리 배치</strong> 기능에서
              입력한 학생 정보는 자리 배치 계산을 위해 이용자 브라우저와 서버에서 일시적으로만 처리되고
              별도의 데이터베이스에 저장하지 않으며, AI 제약 해석 기능 이용 시 입력한 요청 문구가
              처리를 위해 전송될 수 있습니다.
            </p>
          </Section>

          <Section title="제4조 (개인정보의 보유 및 이용 기간)">
            <p>개인정보는 수집·이용 목적이 달성되면 지체 없이 파기하며, 주요 항목의 보유 기간은 다음과 같습니다.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>회원 계정 정보(구글 로그인): 회원 탈퇴 또는 연동 해제 시까지</li>
              <li>가정통신문 및 번역·채팅 기록: 서비스 제공 목적 달성 후 또는 이용자·교사의 삭제 요청 시 파기</li>
              <li>협업 보드 카드·댓글: 게시자 또는 보드 관리자(교사)가 삭제하기 전까지</li>
              <li>자리 배치 입력 정보: 서버에 저장하지 않으며 처리 완료 즉시 파기</li>
              <li>접속·이용 기록: 서비스 통계 및 오·남용 분석 목적으로 보관하며, 목적 달성 후 파기</li>
            </ul>
          </Section>

          <Section title="제5조 (개인정보의 파기 절차 및 방법)">
            <p>
              수집·이용 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일 형태의 정보는
              기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 법령에서 보존을 요구하는 경우
              해당 기간 동안 안전하게 보관한 후 파기합니다.
            </p>
          </Section>

          <Section title="제6조 (만 14세 미만 아동의 개인정보 보호)">
            <p>
              서비스는 초등학생(만 14세 미만 포함)을 포함한 학생이 이용할 수 있는 수업용 도구로서,
              학생 개인의 직접 회원가입이나 실명·연락처 수집 없이 <strong>교사(학교)가 학급 단위로 운영</strong>하는
              것을 원칙으로 합니다. 학생은 닉네임(가명) 또는 기기 식별자만으로 이용하며, 실명·생년월일·연락처
              등은 수집하지 않습니다. 구글 로그인이 필요한 기능은 교사 등 성인 이용자를 전제로 하며, 보호자
              동의가 필요한 경우 학교의 방침(가정통신문 등)에 따라 처리합니다. 아동의 개인정보는 본 방침에
              따라 최소한으로만 처리되고 마케팅 등 목적으로 이용되지 않습니다.
            </p>
          </Section>

          <Section title="제7조 (개인정보의 제3자 제공)">
            <p>
              서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 법령에 특별한
              규정이 있거나 수사기관이 적법한 절차에 따라 요청하는 경우 등 「개인정보 보호법」이 허용하는
              예외에 한하여 제공할 수 있습니다.
            </p>
          </Section>

          <Section title="제8조 (개인정보 처리의 위탁 및 국외 이전)">
            <p>
              서비스는 원활한 기능 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있으며, 관련 정보는
              국외 클라우드 인프라에서 처리·보관될 수 있습니다. 수탁자가 관련 법령을 준수하고 개인정보를 안전하게
              처리하도록 관리·감독합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>OpenAI, L.L.C.</strong> (미국) — 번역, AI 채팅·코칭, 텍스트 임베딩 등 AI 처리</li>
              <li><strong>Vercel Inc.</strong> (미국) — 서비스 호스팅·운영 및 업로드 파일 저장(Vercel Blob)</li>
              <li><strong>Neon Inc.</strong> (미국) — 데이터베이스 저장·관리</li>
              <li><strong>Google LLC</strong> (미국) — 구글 로그인(OAuth) 인증(로그인 기능 이용 시)</li>
            </ul>
          </Section>

          <Section title="제9조 (정보주체의 권리·의무 및 행사 방법)">
            <p>이용자(정보주체)는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리정지를 요구할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>협업 보드에 본인이 작성한 카드·댓글은 직접 삭제할 수 있으며, 보드 관리자(교사)도 관리할 수 있습니다.</li>
              <li>가정통신문 등 교사가 업로드한 자료의 열람·정정·삭제는 해당 교사가 요청·처리할 수 있습니다.</li>
              <li>그 밖의 개인정보 열람·정정·삭제·처리정지 및 계정 삭제 요청은 제12조의 개인정보 보호책임자에게
                요청하면 지체 없이 조치합니다.</li>
            </ul>
          </Section>

          <Section title="제10조 (개인정보의 안전성 확보 조치)">
            <p>서비스는 「개인정보 보호법」 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적·관리적 조치를 하고 있습니다.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>개인정보 전송 시 보안 서버(SSL/TLS) 사용</li>
              <li>인증정보 등 중요 정보의 암호화 처리 및 접근 권한 최소화</li>
              <li>관리자 인증 경로 보호 및 서버 전용 권한을 통한 접근 통제</li>
              <li>개인정보 취급 최소화 및 취급자에 대한 관리</li>
            </ul>
          </Section>

          <Section title="제11조 (쿠키 등 자동 수집 장치의 운영)">
            <p>
              서비스는 로그인 세션 유지 및 협업 보드 닉네임 식별 등을 위해 쿠키를 사용할 수 있습니다.
              이용자는 웹브라우저 설정을 통해 쿠키 저장을 허용하거나 거부할 수 있으며, 쿠키를 거부할 경우
              로그인이 필요한 기능 이용이 제한될 수 있습니다.
            </p>
          </Section>

          <Section title="제12조 (개인정보 보호책임자)">
            <p>
              서비스는 개인정보 처리에 관한 업무를 총괄하고, 이용자의 불만 처리 및 피해 구제 등을 위하여
              아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <ul className="pl-0 space-y-1 mt-2 list-none">
              <li><strong>개인정보 보호책임자</strong>: 석희철 (화진초등학교 교사)</li>
              <li>
                <strong>이메일</strong>:{" "}
                <a href="mailto:sirons1124@gmail.com" className="text-[#2563EB] hover:underline">
                  sirons1124@gmail.com
                </a>
              </li>
            </ul>
          </Section>

          <Section title="제13조 (개인정보처리방침의 변경)">
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가·삭제·정정이
              있는 경우 변경 사항의 시행 7일 전부터 서비스 내 공지를 통해 고지합니다.
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="text-base font-bold text-[#1E293B] mb-2">{title}</h2>
      <div className="text-[#475569] text-[15px]">{children}</div>
    </section>
  );
}
