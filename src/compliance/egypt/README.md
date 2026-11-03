# وحدة الامتثال المصري — Egypt ETA Compliance Module

## ما تفعله هذه الوحدة

تتيح هذه الوحدة إرسال فواتير المبيعات المؤكدة إلى **منظومة الفاتورة الإلكترونية المصرية (ETA)**
التابعة لهيئة الضرائب المصرية، وفق متطلبات القانون المصري لعام 2020 وتعديلاته.

### المكونات

| الملف | الوظيفة |
|---|---|
| `types.ts` | تعريفات TypeScript لبنية مستندات ETA |
| `eta-client.ts` | عميل HTTP للتواصل مع واجهة برمجة ETA (مصادقة + رفع + حالة + إلغاء) |
| `document-builder.ts` | تحويل بيانات الفاتورة من قاعدة البيانات إلى بنية JSON المقبولة من ETA |
| `signer.ts` | التسلسل القانوني (canonical serialization) + تجزئة SHA-256 + التوقيع |
| `index.ts` | الواجهة الرئيسية: `EgyptCompliance` و `createEgyptCompliance()` |

---

## متطلبات البيئة

أضف هذه المتغيرات في لوحة تحكم Vercel (لا تضعها في ملف `.env` المُودَع في git):

```
ETA_CLIENT_ID=<معرف العميل من بوابة ETA للمطورين>
ETA_CLIENT_SECRET=<مفتاح العميل السري>
ETA_ACTIVITY_CODE=<كود النشاط الضريبي — مثال: 4741>
```

---

## الاختبار في بيئة Sandbox

1. سجّل حسابًا في **بوابة ETA للمطورين**: https://sdk.preprod.invoicing.eta.gov.eg
2. أنشئ client credentials وانسخها إلى متغيرات البيئة
3. في بيئة التطوير (`NODE_ENV !== "production"`) تُستخدم بيئة Sandbox تلقائيًا
4. أرسل طلب POST إلى `/api/compliance/egypt/submit` مع `{ "invoiceId": "<id>" }`
5. راجع الاستجابة — تحتوي على `etaUuid` و `status`

---

## الإنتاج — متطلبات إضافية

> ⚠️ التوقيع الرقمي الكامل يتطلب شهادة PKI صادرة عن جهة اعتماد معترف بها من ETA (مثل ITIDA).
> الشهادة عادةً على شكل USB Token.
>
> الكود الحالي يستخدم تجزئة SHA-256 كبديل مؤقت للـ sandbox.
> قبل الإنتاج، استبدل قيمة `value` في `signer.ts` بتوقيع CAdES-BES فعلي.

### خطوات الاعتماد الإنتاجي:

1. سجّل المنشأة في بوابة ETA: https://invoicing.eta.gov.eg
2. احصل على **شهادة توقيع رقمي معتمدة** من ITIDA أو جهة معتمدة
3. أرسل طلب اعتماد كـ "مزود خدمة فاتورة إلكترونية" إذا كنت تخدم أكثر من منشأة
4. استبدل منطق `signDocument()` في `signer.ts` بـ CAdES-BES signing

---

## روابط مفيدة

- بوابة ETA للمطورين (sandbox): https://sdk.preprod.invoicing.eta.gov.eg
- بوابة ETA الإنتاجية: https://sdk.invoicing.eta.gov.eg
- توثيق API: https://sdk.preprod.invoicing.eta.gov.eg/docs
- هيئة الضرائب المصرية: https://www.eta.gov.eg

---

## مثال سريع

```ts
import { createEgyptCompliance } from "@/compliance/egypt";

const compliance = createEgyptCompliance("sandbox");

const result = await compliance.submitInvoice({
  id: invoice.id,
  invoiceNumber: "INV-2024-001",
  documentType: "INVOICE",
  createdAt: new Date(),
  extractedData: null,
  business: { name: "شركة المثال", taxNumber: "123456789", address: "القاهرة", country: "EG" },
  contact: { name: "عميل المثال", taxNumber: null, address: "الجيزة", type: "CUSTOMER" },
  lineItems: [{ description: "خدمات استشارية", quantity: 1, unitPriceEGP: 1000, vatRate: 0.14 }],
});

console.log(result.acceptedDocuments[0]?.uuid); // ETA UUID
```
