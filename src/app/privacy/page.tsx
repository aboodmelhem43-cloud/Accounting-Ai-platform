import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | Privacy Policy — MohasabAi",
  description: "سياسة الخصوصية لمنصة محاسب Ai. Privacy Policy for MohasabAi platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white" dir="auto">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-gray-900 hover:text-blue-600">
            ← MohasabAi
          </Link>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-blue-600">Terms of Use</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        {/* English */}
        <section>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: November 2025</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">1. Information We Collect</h2>
              <p>We collect information you provide directly, such as your name, email address, business name, and country when you register. We also collect financial data you enter into the platform (invoices, journal entries, contacts) to provide the accounting service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>To provide and improve the MohasabAi accounting service.</li>
                <li>To send OTP verification codes and account-related notifications.</li>
                <li>To process payments and manage subscriptions.</li>
                <li>To comply with applicable laws and regulations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">3. Data Isolation</h2>
              <p>Each business account is fully isolated. Your financial data is never accessible to other tenants on the platform. We do not share your data with third parties except as required to operate the service (e.g., cloud hosting, email delivery) or as required by law.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">4. AI Processing</h2>
              <p>Invoice images and documents you upload may be sent to our AI provider (Anthropic) to extract data and suggest journal entries. This data is processed solely to provide the requested feature and is not used to train AI models.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">5. Data Retention</h2>
              <p>We retain your data for the duration of your subscription. If you cancel, your data is kept for 30 additional days so you can export it, then permanently deleted.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">6. Security</h2>
              <p>We use encryption in transit (TLS) and at rest. Access to data is controlled by authentication and multi-tenant isolation. We use OTP-based two-factor authentication for all logins.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">7. Your Rights</h2>
              <p>You may request a copy of your data, correction of inaccuracies, or deletion of your account by contacting us at <a href="mailto:support@mohasabai.com" className="text-blue-600 hover:underline">support@mohasabai.com</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">8. Contact</h2>
              <p>For privacy-related questions, email <a href="mailto:support@mohasabai.com" className="text-blue-600 hover:underline">support@mohasabai.com</a>.</p>
            </section>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* Arabic */}
        <section dir="rtl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">سياسة الخصوصية</h1>
          <p className="text-sm text-gray-500 mb-8">آخر تحديث: نوفمبر 2025</p>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">١. المعلومات التي نجمعها</h2>
              <p>نجمع المعلومات التي تقدمها مباشرةً عند التسجيل، مثل الاسم والبريد الإلكتروني واسم المنشأة والدولة. كما نجمع البيانات المالية التي تُدخلها في المنصة (فواتير، قيود يومية، جهات اتصال) لتقديم الخدمة المحاسبية.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٢. كيف نستخدم معلوماتك</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>لتقديم خدمة محاسب Ai وتحسينها.</li>
                <li>لإرسال رموز التحقق OTP والإشعارات المتعلقة بالحساب.</li>
                <li>لمعالجة المدفوعات وإدارة الاشتراكات.</li>
                <li>للامتثال للقوانين واللوائح المعمول بها.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٣. عزل البيانات</h2>
              <p>كل حساب منشأة معزول تماماً. بياناتك المالية لا يمكن لأي مستأجر آخر الوصول إليها. لا نشارك بياناتك مع أطراف ثالثة إلا بقدر ما يلزم لتشغيل الخدمة أو ما يقتضيه القانون.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٤. معالجة الذكاء الاصطناعي</h2>
              <p>قد تُرسل صور الفواتير والمستندات التي ترفعها إلى مزود الذكاء الاصطناعي (Anthropic) لاستخراج البيانات واقتراح القيود. تُعالج هذه البيانات حصرياً لتقديم الميزة المطلوبة ولا تُستخدم لتدريب نماذج الذكاء الاصطناعي.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٥. الاحتفاظ بالبيانات</h2>
              <p>نحتفظ ببياناتك طوال مدة اشتراكك. في حالة الإلغاء، تُحفظ بياناتك لمدة 30 يوماً إضافية لتتمكن من تصديرها، ثم تُحذف نهائياً.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٦. الأمان</h2>
              <p>نستخدم التشفير أثناء النقل (TLS) وفي حالة السكون. يُتحكم في الوصول إلى البيانات من خلال المصادقة وعزل المستأجرين. نستخدم المصادقة الثنائية بالرمز لجميع عمليات تسجيل الدخول.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٧. حقوقك</h2>
              <p>يمكنك طلب نسخة من بياناتك أو تصحيح الأخطاء أو حذف حسابك عبر التواصل معنا على <a href="mailto:support@mohasabai.com" className="text-blue-600 hover:underline">support@mohasabai.com</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">٨. التواصل</h2>
              <p>للاستفسارات المتعلقة بالخصوصية، راسلنا على <a href="mailto:support@mohasabai.com" className="text-blue-600 hover:underline">support@mohasabai.com</a>.</p>
            </section>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 mt-12 py-6 text-center text-sm text-gray-400">
        <Link href="/" className="hover:text-blue-600">MohasabAi</Link>
        {" · "}
        <Link href="/terms" className="hover:text-blue-600">Terms of Use</Link>
      </footer>
    </div>
  );
}
