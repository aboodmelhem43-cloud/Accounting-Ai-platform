import { PrismaClient, AccountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// دليل الحسابات الافتراضي لمنشأة جديدة
const DEFAULT_ACCOUNTS = [
  // أصول
  { code: "1100", name: "Cash", nameAr: "النقدية", type: AccountType.ASSET },
  { code: "1200", name: "Accounts Receivable", nameAr: "المدينون", type: AccountType.ASSET },
  { code: "1300", name: "Inventory", nameAr: "المخزون", type: AccountType.ASSET },
  // خصوم
  { code: "2100", name: "Accounts Payable", nameAr: "الدائنون", type: AccountType.LIABILITY },
  { code: "2200", name: "Tax Payable", nameAr: "ضريبة القيمة المضافة المستحقة", type: AccountType.LIABILITY },
  // حقوق الملكية
  { code: "3100", name: "Owner Equity", nameAr: "حقوق الملكية", type: AccountType.EQUITY },
  // إيرادات
  { code: "4100", name: "Sales Revenue", nameAr: "إيرادات المبيعات", type: AccountType.REVENUE },
  // مصروفات
  { code: "5100", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", type: AccountType.EXPENSE },
  { code: "5200", name: "Operating Expenses", nameAr: "المصروفات التشغيلية", type: AccountType.EXPENSE },
  { code: "5300", name: "Purchase Expenses", nameAr: "مصروفات المشتريات", type: AccountType.EXPENSE },
];

async function main() {
  console.log("بدء عملية الـ seed...");

  // منشأة تجريبية للتطوير
  const business = await prisma.business.upsert({
    where: { id: "demo-business-001" },
    update: {},
    create: {
      id: "demo-business-001",
      name: "شركة تجريبية للتطوير",
      country: "EG",
      baseCurrency: "EGP",
    },
  });

  // مستخدم تجريبي
  const hashedPassword = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      businessId: business.id,
      email: "demo@example.com",
      passwordHash: hashedPassword,
      name: "مستخدم تجريبي",
      role: "OWNER",
    },
  });

  // دليل الحسابات الافتراضي
  for (const acc of DEFAULT_ACCOUNTS) {
    await prisma.account.upsert({
      where: { businessId_code: { businessId: business.id, code: acc.code } },
      update: {},
      create: {
        businessId: business.id,
        isSystem: true,
        ...acc,
      },
    });
  }

  console.log("تم إنشاء البيانات التجريبية بنجاح");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
