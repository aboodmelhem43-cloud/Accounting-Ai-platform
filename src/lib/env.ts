// طالما أن هذا الملف يُستورد في أي مكان في الكود، سيتم التحقق من المتغيرات عند بدء التشغيل
const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "ANTHROPIC_API_KEY",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
