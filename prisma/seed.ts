import { PrismaClient, AccountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// دليل الحسابات الافتراضي — مشترك لجميع الدول
const DEFAULT_ACCOUNTS = [
  // أصول
  { code: "1100", name: "Cash", nameAr: "النقدية والبنوك", type: AccountType.ASSET },
  { code: "1200", name: "Accounts Receivable", nameAr: "المدينون والعملاء", type: AccountType.ASSET },
  { code: "1300", name: "Inventory", nameAr: "المخزون", type: AccountType.ASSET },
  { code: "1400", name: "Prepaid Expenses", nameAr: "مصروفات مدفوعة مقدمًا", type: AccountType.ASSET },
  // خصوم
  { code: "2100", name: "Accounts Payable", nameAr: "الدائنون والموردون", type: AccountType.LIABILITY },
  { code: "2200", name: "Tax Payable", nameAr: "ضريبة القيمة المضافة المستحقة", type: AccountType.LIABILITY },
  { code: "2300", name: "Accrued Expenses", nameAr: "مصروفات مستحقة", type: AccountType.LIABILITY },
  // حقوق الملكية
  { code: "3100", name: "Owner Equity", nameAr: "حقوق الملكية", type: AccountType.EQUITY },
  { code: "3200", name: "Retained Earnings", nameAr: "الأرباح المحتجزة", type: AccountType.EQUITY },
  // إيرادات
  { code: "4100", name: "Sales Revenue", nameAr: "إيرادات المبيعات", type: AccountType.REVENUE },
  { code: "4200", name: "Service Revenue", nameAr: "إيرادات الخدمات", type: AccountType.REVENUE },
  { code: "4900", name: "Other Revenue", nameAr: "إيرادات أخرى", type: AccountType.REVENUE },
  // مصروفات
  { code: "5100", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", type: AccountType.EXPENSE },
  { code: "5200", name: "Operating Expenses", nameAr: "المصروفات التشغيلية", type: AccountType.EXPENSE },
  { code: "5300", name: "Purchase Expenses", nameAr: "مصروفات المشتريات", type: AccountType.EXPENSE },
  { code: "5400", name: "Salaries", nameAr: "الرواتب والأجور", type: AccountType.EXPENSE },
  { code: "5500", name: "Rent", nameAr: "الإيجار", type: AccountType.EXPENSE },
  { code: "5600", name: "Utilities", nameAr: "المرافق (كهرباء، ماء، اتصالات)", type: AccountType.EXPENSE },
  { code: "5900", name: "Other Expenses", nameAr: "مصروفات أخرى", type: AccountType.EXPENSE },
];

// منشآت تجريبية لكل دولة مدعومة
const DEMO_BUSINESSES = [
  { id: "demo-SA", name: "شركة النخبة للتجارة", country: "SA", currency: "SAR", email: "demo.sa@example.com" },
  { id: "demo-AE", name: "مؤسسة الإمارات للخدمات", country: "AE", currency: "AED", email: "demo.ae@example.com" },
  { id: "demo-KW", name: "مجموعة الخليج الكويتية", country: "KW", currency: "KWD", email: "demo.kw@example.com" },
  { id: "demo-BH", name: "شركة البحرين للأعمال", country: "BH", currency: "BHD", email: "demo.bh@example.com" },
  { id: "demo-QA", name: "مؤسسة قطر للتطوير", country: "QA", currency: "QAR", email: "demo.qa@example.com" },
  { id: "demo-OM", name: "شركة عُمان الحديثة", country: "OM", currency: "OMR", email: "demo.om@example.com" },
  { id: "demo-JO", name: "مؤسسة الأردن للتجارة", country: "JO", currency: "JOD", email: "demo.jo@example.com" },
  { id: "demo-EG", name: "شركة مصر للمقاولات", country: "EG", currency: "EGP", email: "demo.eg@example.com" },
];

async function seedBusiness(id: string, name: string, country: string, currency: string, email: string) {
  const business = await prisma.business.upsert({
    where: { id },
    update: {},
    create: { id, name, country, baseCurrency: currency },
  });

  const hashedPassword = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      businessId: business.id,
      email,
      passwordHash: hashedPassword,
      name: `مستخدم ${name}`,
      role: "OWNER",
    },
  });

  for (const acc of DEFAULT_ACCOUNTS) {
    await prisma.account.upsert({
      where: { businessId_code: { businessId: business.id, code: acc.code } },
      update: {},
      create: { businessId: business.id, isSystem: true, ...acc },
    });
  }

  console.log(`  ✓ ${name} (${country}) — ${email}`);
}

async function main() {
  console.log("بدء عملية الـ seed — منشآت تجريبية لجميع الدول المدعومة...\n");

  for (const b of DEMO_BUSINESSES) {
    await seedBusiness(b.id, b.name, b.country, b.currency, b.email);
  }

  console.log("\n✅ كلمة المرور لجميع الحسابات: password123");
  console.log("✅ تم إنشاء البيانات التجريبية بنجاح");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
