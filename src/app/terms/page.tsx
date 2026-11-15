import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "شروط الاستخدام | Terms of Use — MohasabAi",
  description: "شروط الاستخدام لمنصة محاسب Ai. Terms of Use for MohasabAi platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white" dir="auto">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-gray-900 hover:text-blue-600">
            ← MohasabAi
          </Link>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        {/* English */}
        <section>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: November 2025</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">1. Acceptance of Terms</h2>
              <p>By accessing or using MohasabAi ("the Service"), you agree to be bound by these Terms of Use. If you do not agree, do not use the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">2. Description of Service</h2>
              <p>MohasabAi is a cloud-based accounting platform that helps small and medium-sized businesses manage their accounting, invoices, and financial reports with AI assistance. The Service is provided on a subscription basis.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">3. Account Responsibility</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">4. Acceptable Use</h2>
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Violate any applicable law or regulation.</li>
                <li>Enter false or misleading financial data.</li>
                <li>Attempt to gain unauthorized access to other accounts or systems.</li>
                <li>Transmit malware, spam, or other harmful content.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">5. AI-Generated Content</h2>
              <p>The AI features of the Service (invoice scanning, journal entry suggestions, financial Q&A) are provided as assistance tools only. You are solely responsible for reviewing, verifying, and approving any AI-generated accounting entries before they are recorded.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">6. Subscription and Payments</h2>
              <p>Subscription fees are billed in advance. Cancellations take effect at the end of the current billing period. We reserve the right to modify pricing with reasonable advance notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">7. Disclaimer of Warranties</h2>
              <p>The Service is provided "as is" without warranties of any kind. MohasabAi does not warrant that the Service will be error-free or uninterrupted, or that accounting outputs will be free from errors. The Service does not constitute professional accounting or tax advice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">8. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, MohasabAi shall not be liable for any indirect, incidental, or consequential damages arising from use of the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">9. Changes to Terms</h2>
              <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">10. Contact</h2>
              <p>Questions about these Terms? Email <a href="mailto:support@mohasabai.com" className="text-blue-600 hover:underline">support@mohasabai.com</a>.</p>
            </section>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* Arabic */}
        <section dir="rtl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">شروط الاستخدام</h1>
          <p className="text-sm text-gray-500 mb-8">آخر تحديث: نوفمبر 2025</p>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">١. قبول الشروط</h2>
              <p>باستخدامك لمحاسب Ai ("الخدمة")، فإنك توافق على الالتزام بهذه الشروط. في حال عدم موافقتك، يرجى التوقف عن استخدام الخدمة.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٢. وصف الخدمة</h2>
              <p>محاسب Ai منصة محاسبة سحابية تساعد المشاريع الصغيرة والمتوسطة على إدارة محاسبتها وفواتيرها وتقاريرها المالية بمساعدة الذكاء الاصطناعي. تُقدَّم الخدمة على أساس اشتراكي.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٣. مسؤولية الحساب</h2>
              <p>أنت مسؤول عن الحفاظ على سرية بيانات حسابك وعن جميع الأنشطة التي تتم من خلاله. يجب إخطارنا فوراً بأي استخدام غير مصرح به.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٤. الاستخدام المقبول</h2>
              <p>توافق على عدم استخدام الخدمة لأغراض مخالفة للقانون، أو إدخال بيانات مالية مزيفة، أو محاولة الوصول غير المصرح به إلى حسابات أخرى.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٥. المحتوى الناتج عن الذكاء الاصطناعي</h2>
              <p>ميزات الذكاء الاصطناعي (قراءة الفواتير، اقتراح القيود، الأسئلة المالية) مُقدَّمة كأدوات مساعدة فقط. أنت وحدك مسؤول عن مراجعة وتأكيد أي قيود محاسبية مقترحة قبل تسجيلها.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٦. الاشتراك والمدفوعات</h2>
              <p>تُحصَّل رسوم الاشتراك مسبقاً. يسري الإلغاء في نهاية فترة الفوترة الحالية. نحتفظ بحق تعديل الأسعار مع إشعار مسبق معقول.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٧. إخلاء المسؤولية</h2>
              <p>تُقدَّم الخدمة "كما هي" دون أي ضمانات. لا تضمن محاسب Ai خلوّ الخدمة من الأخطاء أو الانقطاع، ولا تُمثّل الخدمة استشارة محاسبية أو ضريبية مهنية.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٨. تحديد المسؤولية</h2>
              <p>بالقدر الأقصى الذي يسمح به القانون، لن تكون محاسب Ai مسؤولة عن أي أضرار غير مباشرة أو عرضية أو تبعية ناجمة عن استخدام الخدمة.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٩. تعديل الشروط</h2>
              <p>يجوز لنا تحديث هذه الشروط في أي وقت. استمرارك في استخدام الخدمة بعد التغييرات يُعدّ قبولاً للشروط الجديدة.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">١٠. التواصل</h2>
              <p>لأي استفسار، راسلنا على <a href="mailto:support@mohasabai.com" className="text-blue-600 hover:underline">support@mohasabai.com</a>.</p>
            </section>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 mt-12 py-6 text-center text-sm text-gray-400">
        <Link href="/" className="hover:text-blue-600">MohasabAi</Link>
        {" · "}
        <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
      </footer>
    </div>
  );
}
