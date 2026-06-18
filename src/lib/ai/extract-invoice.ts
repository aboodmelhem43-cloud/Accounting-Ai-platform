import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedInvoiceData } from "@/types";
import { getComplianceModule } from "@/compliance";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// استخراج بيانات الفاتورة من صورة أو PDF باستخدام Claude Vision
export async function extractInvoiceData(
  fileBuffer: Buffer,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf",
  countryCode: string
): Promise<ExtractedInvoiceData> {
  const compliance = getComplianceModule(countryCode);

  const systemPrompt = `أنت خبير محاسبي متخصص في استخراج بيانات الفواتير.
استخرج جميع المعلومات من الفاتورة المرفقة وأعدها بصيغة JSON دقيقة.
الدولة: ${compliance.countryNameAr} — العملة المتوقعة: ${compliance.currency} (${compliance.currencySymbol})
نسبة الضريبة المعتادة: ${compliance.hasVat ? `${compliance.vatRate * 100}% (${compliance.vatName})` : "لا توجد ضريبة"}

قواعد الاستخراج:
1. إذا لم تجد قيمة معينة، أعد null وليس قيمة افتراضية.
2. جميع المبالغ يجب أن تكون أرقام عشرية (Decimal) لا نصوص.
3. التاريخ بصيغة ISO 8601 (YYYY-MM-DD).
4. نوع الفاتورة: "purchase" (مشتريات — أنت المشتري) أو "sales" (مبيعات — أنت البائع).
5. confidence: من 0 إلى 1 بحسب وضوح الفاتورة.`;

  const userPrompt = `استخرج بيانات هذه الفاتورة وأعدها بصيغة JSON فقط بدون أي نص إضافي، بهذا الهيكل:
{
  "vendorName": "اسم المورد/البائع",
  "vendorTaxId": "الرقم الضريبي للمورد",
  "customerName": "اسم العميل/المشتري",
  "invoiceNumber": "رقم الفاتورة",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD أو null",
  "currency": "رمز العملة",
  "subtotal": 0.00,
  "taxAmount": 0.00,
  "taxRate": 0.14,
  "totalAmount": 0.00,
  "invoiceType": "purchase أو sales",
  "lineItems": [
    {
      "description": "وصف البند",
      "quantity": 1,
      "unitPrice": 0.00,
      "totalPrice": 0.00,
      "taxRate": null
    }
  ],
  "notes": "أي ملاحظات أخرى",
  "confidence": 0.95
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType === "application/pdf" ? "application/pdf" : mediaType,
              data: fileBuffer.toString("base64"),
            },
          } as Anthropic.ImageBlockParam,
          { type: "text", text: userPrompt },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("استجابة غير متوقعة من النموذج");
  }

  // استخراج JSON من الاستجابة
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("لم يتمكن النموذج من استخراج بيانات الفاتورة");
  }

  const extracted = JSON.parse(jsonMatch[0]) as ExtractedInvoiceData;
  return extracted;
}
