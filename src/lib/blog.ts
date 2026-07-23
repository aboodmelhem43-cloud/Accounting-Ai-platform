export interface BlogPost {
  slug: string;
  date: string;
  readMinutes: number;
  category: { ar: string; en: string };
  title: { ar: string; en: string };
  excerpt: { ar: string; en: string };
  content: { ar: string; en: string };
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "افضل-برنامج-محاسبة-للمشاريع-الصغيرة",
    date: "2025-10-01",
    readMinutes: 6,
    category: { ar: "محاسبة", en: "Accounting" },
    title: {
      ar: "أفضل برنامج محاسبة للمشاريع الصغيرة في 2025",
      en: "Best Accounting Software for Small Businesses in 2025",
    },
    excerpt: {
      ar: "يبحث كثير من أصحاب المشاريع الصغيرة عن برنامج محاسبة يوفر عليهم الوقت والجهد دون الحاجة إلى خبرة محاسبية متعمقة. في هذا المقال نستعرض أهم المعايير التي يجب أن تتوفر في نظام المحاسبة المناسب لعملك. كما نقدم لك مقارنة عملية تساعدك على اتخاذ القرار الصحيح.",
      en: "Many small business owners search for accounting software that saves time and effort without requiring deep accounting expertise. In this article we review the key criteria for choosing the right accounting system for your business, along with a practical comparison to help you decide.",
    },
    content: {
      ar: `<h2>لماذا تحتاج مشروعك الصغير إلى برنامج محاسبة؟</h2>
<p>سواء كنت تدير مطعمًا صغيرًا في الرياض، أو محلًا تجاريًا في القاهرة، أو مكتب خدمات في عمّان، فإن تتبع الإيرادات والمصروفات يدويًا يكلفك ساعات ثمينة كل أسبوع. برنامج المحاسبة الجيد لا يحلّ محل المحاسب فحسب، بل يمنحك صورة واضحة عن وضع نشاطك المالي في أي لحظة.</p>

<h2>المعايير الأساسية لاختيار نظام محاسبة للشركات الصغيرة</h2>
<ul>
  <li><strong>السهولة في الاستخدام:</strong> لا ينبغي أن تحتاج إلى دورة تدريبية طويلة لتبدأ. الواجهة البسيطة تعني وقتًا أقل في التعلم ووقتًا أكثر في العمل.</li>
  <li><strong>المحاسبة السحابية:</strong> الوصول إلى بياناتك من أي مكان وعلى أي جهاز يُعدّ ضرورة لا رفاهية في عام 2025. احرص على اختيار نظام محاسبة سحابي يتيح لك ذلك.</li>
  <li><strong>الامتثال الضريبي المحلي:</strong> في السعودية تحتاج إلى دعم فاتورة ZATCA، وفي مصر إلى منظومة الفاتورة الإلكترونية. تأكد أن البرنامج يتوافق مع متطلبات بلدك.</li>
  <li><strong>التكامل مع أدوات أخرى:</strong> الربط مع بوابات الدفع والمتجر الإلكتروني يوفر عليك إدخال البيانات مرتين.</li>
  <li><strong>التسعير المناسب:</strong> كثير من الحلول الدولية مكلفة وغير مُعرَّبة. ابحث عن برنامج محاسبة للشركات الصغيرة يناسب ميزانيتك ولغتك.</li>
</ul>

<h2>مقارنة بين الخيارات المتاحة في السوق العربي</h2>
<p>تنقسم الخيارات المتاحة بين برامج محلية عربية وأخرى دولية معرَّبة جزئيًا. البرامج الدولية كـ QuickBooks وZoho Books توفر ميزات واسعة لكنها لا تدعم دائمًا متطلبات الفاتورة الإلكترونية المحلية. في المقابل، الحلول العربية المتخصصة كـ <strong>محاسب اي</strong> تُبنى من الأساس لتلبية احتياجات السوق العربي، مع دعم كامل للغة العربية والتقويم الهجري وأنظمة الضرائب المحلية.</p>

<h3>ما يميز محاسب اي عن غيره</h3>
<p>يعتمد <strong>محاسب اي</strong> على نظام القيد المزدوج لضمان دقة البيانات، مع واجهة مبسطة لا تتطلب خلفية محاسبية. يمكنك إصدار الفواتير، تتبع المصروفات، وعرض التقارير المالية في دقائق. الذكاء الاصطناعي المدمج يقرأ صور الفواتير ويقترح التصنيف المحاسبي تلقائيًا، مما يختصر وقتًا كبيرًا في الإدخال اليدوي.</p>

<h2>نصائح عملية قبل الاختيار</h2>
<ul>
  <li>جرّب النسخة التجريبية المجانية قبل الاشتراك، وتحقق من سهولة الاستخدام الفعلي.</li>
  <li>اسأل عن دعم العملاء: هل يوجد دعم باللغة العربية؟ وما أوقات التواصل؟</li>
  <li>تحقق من سياسة النسخ الاحتياطي وأمان البيانات — بياناتك المالية لا تُعوَّض.</li>
  <li>ابدأ بالأساسيات: فواتير، مصروفات، تقارير. لا تدفع مقابل ميزات لن تستخدمها.</li>
</ul>

<h2>الخلاصة</h2>
<p>اختيار برنامج المحاسبة المناسب قرار استراتيجي يؤثر على كفاءة عملك اليومي وامتثالك القانوني. قيّم احتياجاتك أولًا، ثم اختر نظام محاسبة سحابيًا يدعم لغتك وسوقك المحلي. إذا كنت في السعودية أو مصر أو الإمارات أو الأردن، فإن <strong>محاسب اي</strong> مُصمَّم خصيصًا لك — ابدأ تجربتك المجانية اليوم واكتشف كيف تتحول المحاسبة من عبء إلى أداة نمو.</p>`,

      en: `<h2>Why Does Your Small Business Need Accounting Software?</h2>
<p>Whether you run a small restaurant in Riyadh, a retail shop in Cairo, or a service office in Amman, tracking income and expenses manually costs you precious hours every week. Good accounting software doesn't just replace the accountant — it gives you a clear picture of your financial position at any moment.</p>

<h2>Key Criteria for Choosing an Accounting System for Small Businesses</h2>
<ul>
  <li><strong>Ease of use:</strong> You shouldn't need a long training course to get started. A simple interface means less time learning and more time working.</li>
  <li><strong>Cloud accounting:</strong> Accessing your data from anywhere, on any device, is a necessity — not a luxury — in 2025. Make sure you choose a cloud-based accounting system that enables this.</li>
  <li><strong>Local tax compliance:</strong> In Saudi Arabia you need ZATCA e-invoice support; in Egypt you need the national e-invoice system. Verify that the software meets your country's requirements.</li>
  <li><strong>Integration with other tools:</strong> Connecting with payment gateways and e-commerce stores saves you from entering data twice.</li>
  <li><strong>Appropriate pricing:</strong> Many international solutions are expensive and only partially Arabized. Look for accounting software for small businesses that fits your budget and language.</li>
</ul>

<h2>Comparing Available Options in the Arab Market</h2>
<p>Options range from local Arabic software to partially Arabized international platforms. International tools like QuickBooks and Zoho Books offer broad features but don't always support local e-invoice requirements. Purpose-built Arabic solutions like <strong>MohasabAi</strong> are designed from the ground up for the Arab market, with full Arabic-language support, Hijri calendar compatibility, and local tax compliance.</p>

<h3>What Sets MohasabAi Apart</h3>
<p><strong>MohasabAi</strong> is built on a double-entry ledger for data accuracy, wrapped in a simplified interface that requires no accounting background. You can issue invoices, track expenses, and view financial reports in minutes. The built-in AI reads invoice images and suggests accounting classifications automatically, saving significant manual entry time.</p>

<h2>Practical Tips Before You Choose</h2>
<ul>
  <li>Try the free trial before subscribing — verify the actual ease of use for yourself.</li>
  <li>Ask about customer support: Is Arabic support available, and during what hours?</li>
  <li>Check the backup policy and data security — your financial data is irreplaceable.</li>
  <li>Start with the basics: invoices, expenses, reports. Don't pay for features you won't use.</li>
</ul>

<h2>Conclusion</h2>
<p>Choosing the right accounting software is a strategic decision that affects your daily efficiency and legal compliance. Assess your needs first, then choose a cloud accounting system that supports your language and local market. If you're in Saudi Arabia, Egypt, the UAE, or Jordan, <strong>MohasabAi</strong> is built specifically for you — start your free trial today and discover how accounting transforms from a burden into a growth tool.</p>`,
    },
  },

  {
    slug: "ما-هي-فاتورة-zatca-وكيف-تلتزم-بها",
    date: "2025-11-15",
    readMinutes: 7,
    category: { ar: "ضرائب", en: "Tax & Compliance" },
    title: {
      ar: "ما هي فاتورة ZATCA وكيف تلتزم بها؟ دليل شامل 2025",
      en: "What is ZATCA E-Invoice and How to Comply? Complete Guide 2025",
    },
    excerpt: {
      ar: "فرضت هيئة الزكاة والضريبة والجمارك السعودية (ZATCA) نظام الفوترة الإلكترونية على جميع المنشآت المسجلة في ضريبة القيمة المضافة. إذا كنت تعمل في السعودية ولا تزال تصدر فواتير ورقية، فأنت في خطر مخالفات قد تكون مكلفة. هذا الدليل الشامل يوضح لك كل ما تحتاج معرفته للامتثال بسهولة.",
      en: "Saudi Arabia's Zakat, Tax and Customs Authority (ZATCA) has mandated electronic invoicing for all VAT-registered businesses. If you still issue paper invoices in Saudi Arabia, you risk costly penalties. This complete guide explains everything you need to know to comply with ease.",
    },
    content: {
      ar: `<h2>ما هي فاتورة ZATCA؟</h2>
<p>فاتورة ZATCA هي الفاتورة الإلكترونية التي تشترطها هيئة الزكاة والضريبة والجمارك في المملكة العربية السعودية. تختلف عن الفاتورة الورقية أو ملف PDF العادي في أنها تُنشأ بصيغة XML مهيكلة ومُوقَّعة رقميًا، وتُرسَل إلى منصة "فاتورة" التابعة لـ ZATCA للتحقق منها أو الإخطار بها. الهدف الرئيسي من النظام هو رقمنة الاقتصاد، وتعزيز الامتثال الضريبي، وتقليص التهرب من ضريبة القيمة المضافة.</p>

<h2>مراحل تطبيق نظام الفوترة الإلكترونية في السعودية</h2>
<ul>
  <li><strong>المرحلة الأولى (التوليد):</strong> بدأت في ديسمبر 2021، وأصبح إلزاميًا على جميع المنشآت المسجلة في ضريبة القيمة المضافة إصدار فواتيرها إلكترونيًا بدلًا من الورق.</li>
  <li><strong>المرحلة الثانية (الربط والتكامل):</strong> بدأت تدريجيًا من يناير 2023، وتشترط ربط نظام الفوترة مباشرةً بمنصة ZATCA لإرسال الفواتير للتحقق (Clearance) أو الإخطار (Reporting) في الوقت الفعلي.</li>
</ul>

<h2>الفرق بين فاتورة الضريبية وفاتورة ضريبة مبسطة</h2>
<p>يميز نظام e-invoice Saudi Arabia بين نوعين رئيسيين: الفاتورة الضريبية (B2B) التي تصدر في المعاملات بين الشركات وتستلزم خضوع المشتري للضريبة، والفاتورة المبسطة (B2C) التي تُصدَر للأفراد وعادةً ما يحتوي عليها رمز QR. كل نوع له متطلبات حقول مختلفة يجب استيفاؤها لضمان القبول.</p>

<h2>العناصر الإلزامية في فاتورة ZATCA</h2>
<ul>
  <li>الرقم الضريبي للبائع والمشتري (للفواتير الضريبية)</li>
  <li>تاريخ ووقت الإصدار</li>
  <li>وصف السلعة أو الخدمة</li>
  <li>مبلغ ضريبة القيمة المضافة ونسبتها</li>
  <li>الإجمالي شاملًا الضريبة</li>
  <li>رمز QR (للفواتير المبسطة على الأقل)</li>
  <li>التوقيع الرقمي المعتمد</li>
</ul>

<h2>كيف تلتزم بمتطلبات ZATCA بدون صداع؟</h2>
<p>الخطأ الشائع هو محاولة إنشاء ملفات XML يدويًا أو استخدام Excel. الحل العملي هو استخدام برنامج فوترة إلكترونية معتمد يتكفل بكل التفاصيل التقنية. <strong>محاسب اي</strong> مُهيَّأ لمتطلبات ZATCA الكاملة: يُنشئ الفواتير بصيغة XML المعتمدة، يوقّعها رقميًا، ويُرسلها تلقائيًا إلى منصة ZATCA للتحقق أو الإخطار، ويحتفظ بسجل كامل قابل للمراجعة في أي وقت.</p>

<h3>خطوات البدء الفورية</h3>
<ul>
  <li>تحقق من تسجيلك في ضريبة القيمة المضافة لدى ZATCA إن لم تكن قد فعلت.</li>
  <li>احصل على شهادة CSID من منصة ZATCA لربط نظامك.</li>
  <li>اختر برنامجًا معتمدًا يدعم الربط التلقائي مع المنصة.</li>
  <li>درّب فريقك على إصدار الفواتير بالطريقة الجديدة.</li>
  <li>احتفظ بنسخ احتياطية من جميع الفواتير الصادرة لمدة لا تقل عن خمس سنوات.</li>
</ul>

<h2>العقوبات على عدم الامتثال</h2>
<p>المخالفات تبدأ من غرامات مالية وقد تصل إلى إيقاف النشاط التجاري في حالات التكرار. لا تنتظر حتى تأتيك مخالفة — الامتثال اليوم أرخص بكثير من الغرامات غدًا. مع <strong>محاسب اي</strong>، يمكنك التحقق من امتثال كل فاتورة قبل إرسالها، مما يقضي على القلق من الأخطاء غير المقصودة.</p>

<h2>خلاصة</h2>
<p>نظام فاتورة ZATCA ليس خيارًا بل إلزامًا قانونيًا لكل منشأة مسجلة في ضريبة القيمة المضافة بالمملكة. الامتثال الصحيح يحميك من الغرامات ويرفع مصداقية نشاطك أمام عملائك وشركائك. ابدأ بالخطوات العملية المذكورة أعلاه، واستعن بحل تقني موثوق يريحك من التفاصيل التقنية.</p>`,

      en: `<h2>What is a ZATCA E-Invoice?</h2>
<p>A ZATCA e-invoice is the electronic invoice mandated by Saudi Arabia's Zakat, Tax and Customs Authority. Unlike a paper invoice or a regular PDF, it is generated as a structured XML file, digitally signed, and submitted to the ZATCA "Fatoora" platform for clearance or reporting. The system's primary goal is to digitize the economy, strengthen VAT compliance, and reduce tax evasion.</p>

<h2>Phases of Saudi Arabia's E-Invoicing Rollout</h2>
<ul>
  <li><strong>Phase 1 (Generation):</strong> Launched December 2021. All VAT-registered businesses must issue invoices electronically instead of on paper.</li>
  <li><strong>Phase 2 (Integration):</strong> Rolling out gradually since January 2023. Businesses must integrate their invoicing system directly with ZATCA's platform to submit invoices for real-time clearance (B2B) or reporting (B2C).</li>
</ul>

<h2>Tax Invoice vs. Simplified Tax Invoice</h2>
<p>Saudi Arabia's e-invoice system distinguishes two main types: the Tax Invoice (B2B), issued in business-to-business transactions where the buyer is VAT-registered; and the Simplified Tax Invoice (B2C), issued to individual consumers and typically carrying a QR code. Each type has different mandatory field requirements that must be met for ZATCA to accept the invoice.</p>

<h2>Mandatory Fields in a ZATCA Invoice</h2>
<ul>
  <li>VAT registration number of seller and buyer (for tax invoices)</li>
  <li>Issue date and time</li>
  <li>Description of goods or services</li>
  <li>VAT amount and applicable rate</li>
  <li>Total including VAT</li>
  <li>QR code (required at minimum for simplified invoices)</li>
  <li>Approved digital signature</li>
</ul>

<h2>How to Comply with ZATCA Without the Headache</h2>
<p>A common mistake is trying to produce XML files manually or use Excel. The practical solution is a certified e-invoicing platform that handles all technical details for you. <strong>MohasabAi</strong> is fully configured for ZATCA requirements: it generates invoices in the approved XML format, digitally signs them, and automatically submits them to the ZATCA platform for clearance or reporting — keeping a complete, auditable record at all times.</p>

<h3>Immediate Action Steps</h3>
<ul>
  <li>Confirm your VAT registration with ZATCA if you haven't already.</li>
  <li>Obtain a CSID certificate from the ZATCA platform to link your system.</li>
  <li>Choose a certified software that supports automatic platform integration.</li>
  <li>Train your team on the new invoicing workflow.</li>
  <li>Keep backup copies of all issued invoices for at least five years.</li>
</ul>

<h2>Penalties for Non-Compliance</h2>
<p>Violations start with financial fines and can escalate to business suspension for repeat offenders. Don't wait for a fine to arrive — compliance today is far cheaper than penalties tomorrow. With <strong>MohasabAi</strong>, every invoice is validated before submission, eliminating anxiety about accidental errors.</p>

<h2>Conclusion</h2>
<p>The ZATCA e-invoice system is not optional — it is a legal obligation for every VAT-registered business in the Kingdom. Proper compliance protects you from fines and raises your credibility with customers and partners. Follow the practical steps above and use a reliable technical solution to handle the details for you.</p>`,
    },
  },

  {
    slug: "كيف-تدير-فواتير-شركتك-بشكل-احترافي",
    date: "2026-01-10",
    readMinutes: 5,
    category: { ar: "فواتير", en: "Invoicing" },
    title: {
      ar: "كيف تدير فواتير شركتك بشكل احترافي وتوفر وقتك",
      en: "How to Manage Your Business Invoices Professionally and Save Time",
    },
    excerpt: {
      ar: "إدارة الفواتير بشكل فوضوي تعني ضياع إيرادات، تأخير في التحصيل، وأخطاء ضريبية مكلفة. في هذا المقال تتعلم كيف تبني نظامًا احترافيًا لإدارة فواتيرك الإلكترونية يوفر عليك ساعات كل شهر. النتيجة: تدفق نقدي أفضل واطمئنان أكبر.",
      en: "Chaotic invoice management means lost revenue, delayed collections, and costly tax errors. In this article you'll learn how to build a professional system for managing your electronic invoices that saves you hours every month — resulting in better cash flow and greater peace of mind.",
    },
    content: {
      ar: `<h2>المشكلة: لماذا تعاني كثير من الشركات الصغيرة من فوضى الفواتير؟</h2>
<p>تبدأ المشكلة عادةً بطريقة بسيطة: فاتورة تُرسَل عبر واتساب، وأخرى عبر الإيميل، وثالثة مطبوعة ومحفوظة في درج. مع نمو العمل تتضاعف الفواتير، ويصبح تتبعها كابوسًا. من لم يدفع؟ ماذا كان إجمالي المبيعات الشهر الماضي؟ كم ضريبة قيمة مضافة يجب تسديدها؟ هذه أسئلة يجب أن تجيب عنها بياناتك لا ذاكرتك.</p>

<h2>أساسيات نظام إدارة الفواتير الاحترافي</h2>
<h3>١. استخدم برنامج فواتير موحدًا</h3>
<p>أول خطوة هي مركزة كل الفواتير في مكان واحد. برنامج فواتير مخصص يتيح لك إنشاء الفاتورة، إرسالها للعميل، تتبع حالتها (مرسلة، مُشاهَدة، مدفوعة، متأخرة)، وأرشفتها تلقائيًا. هذا وحده يُلغي معظم الفوضى.</p>

<h3>٢. عيّن رقمًا تسلسليًا لكل فاتورة</h3>
<p>الترقيم المتسلسل ليس مجرد ترتيب — هو اشتراط قانوني في كثير من الدول. تأكد أن كل فاتورة لها رقم فريد لا يتكرر، يسهل الرجوع إليه عند النزاعات أو المراجعات الضريبية.</p>

<h3>٣. حدد شروط الدفع بوضوح</h3>
<p>فاتورة بلا تاريخ استحقاق واضح هي دعوة للتأخير. اكتب دائمًا: "يستحق الدفع خلال 30 يومًا من تاريخ الإصدار" أو أي شرط تتفق عليه مع عميلك مسبقًا. بعض المنشآت تضيف رسوم تأخير — وهذا حقك القانوني ويجب تحديده في الفاتورة.</p>

<h3>٤. أرسل تذكيرات تلقائية قبل الاستحقاق وبعده</h3>
<p>المتابعة اليدوية مرهقة ومحرجة أحيانًا. نظام الفواتير الإلكترونية الجيد يُرسل تذكيرات تلقائية بالبريد الإلكتروني قبل موعد الدفع وبعده. هذا وحده يحسّن معدل التحصيل بشكل ملحوظ.</p>

<h2>إدارة فواتير المشتريات أيضًا</h2>
<p>إدارة الفواتير لا تعني فقط فواتير البيع. فواتير المشتريات التي تستلمها من مورديك يجب أرشفتها أيضًا، ومطابقتها مع أوامر الشراء، والتأكد من تسجيل ضريبة القيمة المضافة المدفوعة بشكل صحيح لاسترداد ما يستحق منها.</p>

<h2>كيف يساعدك محاسب اي في إدارة الفواتير</h2>
<p>يتيح لك <strong>محاسب اي</strong> إنشاء فواتير احترافية بالعربية والإنجليزية في ثوانٍ، مع قوالب قابلة للتخصيص تعكس هوية علامتك التجارية. يمكنك تتبع حالة كل فاتورة في لوحة تحكم واحدة، وإرسال تذكيرات تلقائية للعملاء، ورؤية تقرير التدفق النقدي لحظيًا. الذكاء الاصطناعي يقرأ فواتير الموردين الواردة ويقترح القيد المحاسبي تلقائيًا — أنت فقط تؤكد.</p>

<h2>نصائح سريعة لتحصيل أسرع</h2>
<ul>
  <li>أرسل الفاتورة فور إتمام الخدمة أو التسليم — لا تنتظر نهاية الشهر.</li>
  <li>وفّر طرق دفع متعددة: تحويل بنكي، بطاقة ائتمان، محافظ رقمية.</li>
  <li>كافئ العملاء على الدفع المبكر بخصم صغير (مثلاً 2% خصم إذا دفع خلال 7 أيام).</li>
  <li>راجع تقرير "الفواتير المتأخرة" أسبوعيًا وتواصل مع العملاء المتأخرين فورًا.</li>
</ul>

<h2>خلاصة</h2>
<p>إدارة الفواتير الاحترافية ليست ترفًا — هي عصب التدفق النقدي لنشاطك. النظام الصحيح يعني تحصيلًا أسرع، وامتثالًا ضريبيًا دقيقًا، وصورة أوضح عن وضعك المالي. جرّب <strong>محاسب اي</strong> مجانًا وابدأ بإصدار فواتيرك الإلكترونية باحترافية من اليوم الأول.</p>`,

      en: `<h2>The Problem: Why Do Small Businesses Struggle with Invoice Chaos?</h2>
<p>It usually starts simply: one invoice sent via WhatsApp, another by email, a third printed and filed in a drawer. As the business grows, invoices multiply and tracking them becomes a nightmare. Who hasn't paid? What were last month's total sales? How much VAT needs to be remitted? These are questions your data should answer — not your memory.</p>

<h2>Essentials of a Professional Invoice Management System</h2>
<h3>1. Use a Unified Invoicing Platform</h3>
<p>The first step is centralizing all invoices in one place. Dedicated invoicing software lets you create an invoice, send it to the client, track its status (sent, viewed, paid, overdue), and archive it automatically. This alone eliminates most of the chaos.</p>

<h3>2. Assign a Sequential Number to Every Invoice</h3>
<p>Sequential numbering is not just organization — it's a legal requirement in many countries. Make sure every invoice carries a unique, non-repeating number that's easy to reference in disputes or tax audits.</p>

<h3>3. State Payment Terms Clearly</h3>
<p>An invoice without a clear due date is an invitation for delay. Always write: "Payment due within 30 days of issue date" or whatever term you agreed with your client in advance. Some businesses also add late-payment fees — which is your legal right and should be stated on the invoice.</p>

<h3>4. Send Automatic Reminders Before and After the Due Date</h3>
<p>Manual follow-up is exhausting and sometimes awkward. A good electronic invoicing system sends automatic email reminders before and after the payment date. This alone noticeably improves collection rates.</p>

<h2>Managing Purchase Invoices Too</h2>
<p>Invoice management is not just about sales invoices. Purchase invoices you receive from suppliers must also be archived, matched against purchase orders, and properly recorded for VAT reclaim purposes.</p>

<h2>How MohasabAi Helps You Manage Invoices</h2>
<p><strong>MohasabAi</strong> lets you create professional invoices in Arabic and English in seconds, with customizable templates that reflect your brand identity. Track every invoice's status in a single dashboard, send automatic client reminders, and view a real-time cash flow report instantly. The built-in AI reads incoming supplier invoices and suggests the accounting entry automatically — you simply confirm.</p>

<h2>Quick Tips for Faster Collection</h2>
<ul>
  <li>Send the invoice immediately after completing a service or delivery — don't wait until the end of the month.</li>
  <li>Offer multiple payment methods: bank transfer, credit card, digital wallets.</li>
  <li>Reward early-paying clients with a small discount (e.g., 2% off if paid within 7 days).</li>
  <li>Review the "overdue invoices" report weekly and contact late payers immediately.</li>
</ul>

<h2>Conclusion</h2>
<p>Professional invoice management is not a luxury — it is the lifeblood of your cash flow. The right system means faster collection, accurate tax compliance, and a clearer picture of your financial position. Try <strong>MohasabAi</strong> for free and start issuing professional electronic invoices from day one.</p>`,
    },
  },

  {
    slug: "ما-هو-القيد-المزدوج-في-المحاسبة",
    date: "2026-03-05",
    readMinutes: 6,
    category: { ar: "تعليم محاسبي", en: "Accounting Basics" },
    title: {
      ar: "ما هو القيد المزدوج في المحاسبة وكيف يفيد نشاطك التجاري؟",
      en: "What is Double-Entry Accounting and How Does It Benefit Your Business?",
    },
    excerpt: {
      ar: "مبدأ القيد المزدوج هو العمود الفقري لأي نظام محاسبي موثوق، وهو ما تستخدمه كبرى الشركات في العالم منذ قرون. لا تحتاج إلى أن تكون محاسبًا متخصصًا لتفهمه وتستفيد منه. هذا المقال يشرح المفهوم بأمثلة عملية تتعلق بك كصاحب مشروع.",
      en: "The double-entry principle is the backbone of any reliable accounting system, used by the world's largest companies for centuries. You don't need to be a professional accountant to understand it and benefit from it. This article explains the concept with practical examples relevant to you as a business owner.",
    },
    content: {
      ar: `<h2>ما هو القيد المزدوج؟</h2>
<p>مبدأ القيد المزدوج (Double-Entry Accounting) يقوم على فكرة بسيطة: كل عملية مالية تؤثر على جانبين في نفس الوقت — جانب المدين (ما يدخل أو ما يزيد في الأصول) وجانب الدائن (ما يخرج أو مصدر هذا الأصل). والقاعدة الذهبية هي أن مجموع المدين يساوي دائمًا مجموع الدائن في كل قيد.</p>
<p>هذا المبدأ لم يُخترع حديثًا — يعود تاريخه إلى القرن الخامس عشر في إيطاليا، وطوّره الراهب الرياضي لوكا باتشيولي. اليوم هو المعيار المحاسبي المقبول دوليًا في معايير IFRS وغيرها.</p>

<h2>مثال عملي: شراء معدات لمشروعك</h2>
<p>لنقل إنك اشتريت حاسوبًا لمكتبك بقيمة 5,000 ريال نقدًا. في نظام القيد المزدوج:</p>
<ul>
  <li><strong>مدين — الأصول الثابتة (المعدات):</strong> 5,000 ريال (ارتفع رصيدك من المعدات)</li>
  <li><strong>دائن — النقدية:</strong> 5,000 ريال (انخفض رصيدك النقدي)</li>
</ul>
<p>المجموع متوازن. ميزانيتك العمومية لم تتغير في إجماليها — فقط انتقلت قيمة من شكل إلى آخر.</p>

<h2>لماذا القيد المزدوج أهم من القيد الفردي؟</h2>
<p>بعض برامج المحاسبة البسيطة أو جداول Excel تعتمد على تسجيل الإيرادات والمصروفات فقط (قيد فردي). هذا الأسلوب كافٍ لمعرفة الربح والخسارة لكنه يفشل في:</p>
<ul>
  <li>رصد الأصول والخصوم بدقة</li>
  <li>اكتشاف الأخطاء والاحتيال المالي</li>
  <li>إنتاج ميزانية عمومية صحيحة</li>
  <li>الامتثال لمعايير المحاسبة الدولية</li>
</ul>
<p>نظام دفتر اليومية المبني على القيد المزدوج يضمن أن كل ريال له مصدر ومصب، مما يجعل الأخطاء مكشوفة على الفور عند عدم التوازن.</p>

<h2>المعادلة المحاسبية الأساسية</h2>
<p>كل نظام قيد مزدوج يقوم على هذه المعادلة:</p>
<p><strong>الأصول = الخصوم + حقوق الملكية</strong></p>
<p>كل قيد يجب أن يحافظ على توازن هذه المعادلة. إذا اختلت، فهناك خطأ في مكان ما.</p>

<h2>كيف يطبّق محاسب اي مبدأ القيد المزدوج؟</h2>
<p>يعتمد <strong>محاسب اي</strong> على محرك قيد مزدوج داخلي كامل — لكنه يُخفي التعقيد التقني عن صاحب المشروع غير المحاسب. حين تصدر فاتورة بيع، يُسجَّل القيد تلقائيًا (مدين ذمم مدينة، دائن إيرادات). حين تدفع فاتورة مورّد، يُسجَّل القيد المقابل. وفي حالة استخدام الذكاء الاصطناعي لاقتراح قيود الفواتير المستوردة، تظهر لك شاشة مراجعة للتأكيد قبل أي حفظ — لأن دقة القيود مسؤوليتك أنت في نهاية المطاف.</p>

<h2>نصائح عملية لأصحاب المشاريع</h2>
<ul>
  <li>لا تخلط بين حسابك الشخصي والحساب التجاري — هذا الخلط يُفسد دقة القيود تمامًا.</li>
  <li>سجّل كل عملية فور حدوثها، لا في نهاية الشهر — التسويف يُراكم الأخطاء.</li>
  <li>راجع ميزان المراجعة شهريًا للتأكد من أن المدين يساوي الدائن.</li>
  <li>اطلب من محاسبك أو برنامجك توضيح القيد لكل عملية — الفهم يحمي أموالك.</li>
</ul>

<h2>خلاصة</h2>
<p>مبدأ القيد المزدوج ليس مجرد مصطلح أكاديمي — هو ضمانة دقة بياناتك المالية. عندما تعرف أن كل ريال في نشاطك التجاري موثق بجانبين متوازنين، تصبح ثقتك في تقاريرك المالية أعلى، وقراراتك أفضل. <strong>محاسب اي</strong> يوفر لك هذا الأساس المتين مع واجهة يفهمها أي شخص.</p>`,

      en: `<h2>What is Double-Entry Accounting?</h2>
<p>The double-entry accounting principle is built on a simple idea: every financial transaction affects two sides simultaneously — the debit side (what comes in or increases in assets) and the credit side (what goes out or the source of that asset). The golden rule is that the total of debits always equals the total of credits in every journal entry.</p>
<p>This principle wasn't invented recently — it dates back to 15th-century Italy and was formalized by mathematician-monk Luca Pacioli. Today it is the internationally accepted accounting standard underpinning IFRS and other frameworks.</p>

<h2>A Practical Example: Buying Equipment for Your Business</h2>
<p>Suppose you bought a computer for your office for SAR 5,000 in cash. In a double-entry system:</p>
<ul>
  <li><strong>Debit — Fixed Assets (Equipment):</strong> SAR 5,000 (your equipment balance increases)</li>
  <li><strong>Credit — Cash:</strong> SAR 5,000 (your cash balance decreases)</li>
</ul>
<p>The entry is balanced. Your balance sheet total hasn't changed — value simply moved from one form to another.</p>

<h2>Why Double-Entry Beats Single-Entry</h2>
<p>Some simple accounting apps or Excel sheets only record income and expenses (single-entry). This is enough to know profit and loss, but it fails at:</p>
<ul>
  <li>Accurately tracking assets and liabilities</li>
  <li>Detecting errors and financial fraud</li>
  <li>Producing a correct balance sheet</li>
  <li>Complying with international accounting standards</li>
</ul>
<p>A journal-based double-entry system ensures every monetary unit has a source and a destination, making errors immediately visible whenever the books don't balance.</p>

<h2>The Fundamental Accounting Equation</h2>
<p>Every double-entry system rests on this equation:</p>
<p><strong>Assets = Liabilities + Owner's Equity</strong></p>
<p>Every entry must preserve this balance. If it breaks, there's an error somewhere.</p>

<h2>How MohasabAi Applies the Double-Entry Principle</h2>
<p><strong>MohasabAi</strong> runs a full double-entry ledger engine internally — but hides the technical complexity from the non-accountant business owner. When you issue a sales invoice, the entry is recorded automatically (debit accounts receivable, credit revenue). When you pay a supplier invoice, the corresponding entry is made. When AI suggests entries for imported invoices, a review screen appears for your confirmation before anything is saved — because the accuracy of your records is ultimately your responsibility.</p>

<h2>Practical Tips for Business Owners</h2>
<ul>
  <li>Never mix your personal account with your business account — this mixing completely ruins the accuracy of your records.</li>
  <li>Record every transaction when it happens, not at the end of the month — procrastination compounds errors.</li>
  <li>Review the trial balance monthly to confirm that debits equal credits.</li>
  <li>Ask your accountant or software to explain the entry behind each transaction — understanding protects your money.</li>
</ul>

<h2>Conclusion</h2>
<p>The double-entry principle is not just an academic term — it is your guarantee of accurate financial data. When you know that every riyal in your business is documented on two balanced sides, your confidence in your financial reports grows and your decisions improve. <strong>MohasabAi</strong> gives you this solid foundation wrapped in an interface anyone can understand.</p>`,
    },
  },

  {
    slug: "قائمة-الدخل-والميزانية-العمومية",
    date: "2026-06-01",
    readMinutes: 7,
    category: { ar: "تقارير مالية", en: "Financial Reports" },
    title: {
      ar: "كيف تقرأ قائمة الدخل والميزانية العمومية لنشاطك التجاري",
      en: "How to Read Your Income Statement and Balance Sheet",
    },
    excerpt: {
      ar: "التقارير المالية ليست حكرًا على المحاسبين — كل صاحب مشروع يجب أن يفهم قائمة الدخل والميزانية العمومية ليتخذ قرارات مبنية على أرقام حقيقية لا على الحدس. في هذا المقال نشرح القراءة العملية لهذين التقريرين الأساسيين بأسلوب مبسط.",
      en: "Financial reports are not reserved for accountants — every business owner should understand the income statement and balance sheet to make decisions based on real numbers, not intuition. In this article we explain how to practically read these two essential reports in a straightforward way.",
    },
    content: {
      ar: `<h2>لماذا تحتاج إلى قراءة التقارير المالية؟</h2>
<p>كثير من أصحاب المشاريع الصغيرة يقيسون نجاح نشاطهم بحركة الحساب البنكي فقط. لكن الحساب البنكي يكذب أحيانًا: ربما لديك رصيد جيد لأنك لم تسدد الموردين بعد، أو ربما رصيدك منخفض رغم أن لديك أرباحًا كبيرة في الفواتير غير المحصلة. التقارير المالية تعطيك الحقيقة الكاملة.</p>

<h2>أولًا: قائمة الدخل (Income Statement)</h2>
<p>قائمة الدخل تجيب على سؤال واحد: هل نشاطي التجاري يحقق ربحًا أم خسارة في فترة معينة؟ هي تقرير للفترة الزمنية (شهر، ربع، سنة) وتُبنى من الأعلى إلى الأسفل:</p>
<ul>
  <li><strong>الإيرادات (المبيعات):</strong> إجمالي ما بعته من منتجات أو خدمات.</li>
  <li><strong>تكلفة البضاعة المباعة:</strong> التكلفة المباشرة لإنتاج ما بعته.</li>
  <li><strong>مجمل الربح = الإيرادات − التكلفة المباشرة.</strong></li>
  <li><strong>المصروفات التشغيلية:</strong> الإيجار، الرواتب، التسويق، الاتصالات، وغيرها.</li>
  <li><strong>صافي الربح = مجمل الربح − المصروفات التشغيلية.</strong></li>
</ul>
<p>صافي الربح هو الرقم الأهم: إذا كان موجبًا فنشاطك مربح، وإذا كان سالبًا فثمة مشكلة تستدعي البحث في أسبابها سريعًا.</p>

<h3>ماذا تراقب في قائمة الدخل؟</h3>
<ul>
  <li>هامش الربح الإجمالي: نسبة مجمل الربح إلى الإيرادات. كلما ارتفع كان أفضل.</li>
  <li>المصروفات المتزايدة: هل ترتفع بشكل أسرع من الإيرادات؟ هذا إشارة تحذير.</li>
  <li>مقارنة الأشهر: هل المبيعات تنمو؟ هل مصروف معين قفز فجأة؟</li>
</ul>

<h2>ثانيًا: الميزانية العمومية (Balance Sheet)</h2>
<p>الميزانية العمومية تجيب على سؤال مختلف: ما هو وضع نشاطي المالي في لحظة معينة؟ هي صورة فورية (snapshot) لا تقرير فترة. تنقسم إلى ثلاثة أقسام:</p>
<ul>
  <li><strong>الأصول:</strong> كل ما تملكه — نقدية، مخزون، ذمم مدينة (فواتير لم تُحصَّل بعد)، معدات، عقارات.</li>
  <li><strong>الخصوم:</strong> كل ما عليك — قروض، ذمم دائنة (فواتير لم تدفعها بعد)، رواتب مستحقة.</li>
  <li><strong>حقوق الملكية:</strong> ما تبقى لك بعد طرح الخصوم من الأصول. هذا هو صافي ثروة نشاطك.</li>
</ul>
<p>المعادلة الدائمة: <strong>الأصول = الخصوم + حقوق الملكية.</strong></p>

<h3>ماذا تراقب في الميزانية العمومية؟</h3>
<ul>
  <li><strong>نسبة السيولة:</strong> هل الأصول المتداولة (النقدية + الذمم المدينة + المخزون) تكفي لسداد الخصوم المتداولة؟</li>
  <li><strong>الذمم المدينة المتراكمة:</strong> فواتير قديمة غير محصّلة تعني مشكلة في التحصيل.</li>
  <li><strong>نمو حقوق الملكية:</strong> إذا كانت ترتفع من سنة إلى أخرى، نشاطك ينمو فعلًا.</li>
</ul>

<h2>العلاقة بين التقريرين</h2>
<p>صافي الربح من قائمة الدخل ينتقل إلى الميزانية العمومية ويزيد من حقوق الملكية. الخسارة تقلصها. هذا الربط هو ما يجعل نظام القيد المزدوج متسقًا ودقيقًا — لا أرقام معزولة.</p>

<h2>كيف يُسهّل عليك محاسب اي فهم تقاريرك المالية</h2>
<p>يُنشئ <strong>محاسب اي</strong> قائمة الدخل والميزانية العمومية تلقائيًا من القيود اليومية دون أن تُدخل أي أرقام يدويًا. لوحة التحكم تعرض مؤشرات رئيسية لحظية: الإيرادات حتى اليوم، صافي الربح، الفواتير المعلقة، والرصيد النقدي — كل ذلك في مكان واحد. يمكنك تصدير التقارير PDF لمشاركتها مع المستثمرين أو البنوك أو مكتب الضرائب بنقرة واحدة.</p>

<h2>خلاصة</h2>
<p>قراءة التقارير المالية مهارة يمكن لأي صاحب مشروع اكتسابها. ابدأ بقائمة الدخل لتعرف ربحيتك، ثم انظر في الميزانية العمومية لتفهم وضعك المالي العام. مع منصة <strong>محاسب اي</strong>، هذه التقارير متاحة دائمًا ومحدّثة لحظيًا — لا انتظار لنهاية الشهر ولا حاجة لطلب تقرير من محاسبك في كل مرة.</p>`,

      en: `<h2>Why Do You Need to Read Financial Reports?</h2>
<p>Many small business owners measure their success solely by their bank account balance. But the bank balance can be misleading: you might have a healthy balance because you haven't paid your suppliers yet, or your balance might be low even though you have significant profits sitting in uncollected invoices. Financial reports give you the complete truth.</p>

<h2>Part One: The Income Statement</h2>
<p>The income statement answers one question: is my business making a profit or a loss over a given period? It covers a time period (month, quarter, year) and flows from top to bottom:</p>
<ul>
  <li><strong>Revenue (Sales):</strong> Total of everything you sold — products or services.</li>
  <li><strong>Cost of Goods Sold:</strong> The direct cost of producing what you sold.</li>
  <li><strong>Gross Profit = Revenue − Direct Costs.</strong></li>
  <li><strong>Operating Expenses:</strong> Rent, salaries, marketing, utilities, and other overheads.</li>
  <li><strong>Net Profit = Gross Profit − Operating Expenses.</strong></li>
</ul>
<p>Net profit is the most important number: positive means your business is profitable; negative means there's a problem that demands immediate investigation.</p>

<h3>What to Monitor in the Income Statement</h3>
<ul>
  <li>Gross margin: gross profit as a percentage of revenue. Higher is better.</li>
  <li>Rising expenses: are they growing faster than revenue? That's a warning sign.</li>
  <li>Month-over-month comparison: is revenue growing? Did a particular expense spike suddenly?</li>
</ul>

<h2>Part Two: The Balance Sheet</h2>
<p>The balance sheet answers a different question: what is my business's financial position at a specific moment? It is a snapshot in time, not a period report. It has three sections:</p>
<ul>
  <li><strong>Assets:</strong> Everything you own — cash, inventory, accounts receivable (uncollected invoices), equipment, property.</li>
  <li><strong>Liabilities:</strong> Everything you owe — loans, accounts payable (unpaid supplier invoices), accrued salaries.</li>
  <li><strong>Owner's Equity:</strong> What remains after subtracting liabilities from assets. This is the net worth of your business.</li>
</ul>
<p>The permanent equation: <strong>Assets = Liabilities + Owner's Equity.</strong></p>

<h3>What to Monitor in the Balance Sheet</h3>
<ul>
  <li><strong>Liquidity ratio:</strong> Do current assets (cash + receivables + inventory) cover current liabilities?</li>
  <li><strong>Aging receivables:</strong> Old uncollected invoices signal a collection problem.</li>
  <li><strong>Owner's equity growth:</strong> If it rises year over year, your business is genuinely growing.</li>
</ul>

<h2>The Connection Between the Two Reports</h2>
<p>Net profit from the income statement flows into the balance sheet and increases owner's equity. A loss shrinks it. This linkage is what makes the double-entry system consistent and accurate — no isolated numbers.</p>

<h2>How MohasabAi Makes Your Financial Reports Easy to Understand</h2>
<p><strong>MohasabAi</strong> generates the income statement and balance sheet automatically from daily journal entries — with no manual number entry required from you. The dashboard displays real-time key indicators: revenue to date, net profit, pending invoices, and cash balance — all in one place. Export reports to PDF to share with investors, banks, or the tax authority with a single click.</p>

<h2>Conclusion</h2>
<p>Reading financial reports is a skill any business owner can develop. Start with the income statement to understand your profitability, then look at the balance sheet to grasp your overall financial position. With <strong>MohasabAi</strong>, these reports are always available and updated in real time — no waiting until month end, no need to request a report from your accountant every time.</p>`,
    },
  },
  // ─── NEW ARTICLES ───
  {
    slug: "بديل-quickbooks-للشركات-العربية",
    date: "2026-01-15",
    readMinutes: 7,
    category: { ar: "مقارنة برامج", en: "Software Comparison" },
    title: {
      ar: "أفضل بديل لـ QuickBooks للشركات في السعودية ومصر والإمارات",
      en: "Best QuickBooks Alternative for Businesses in Saudi Arabia, Egypt & UAE",
    },
    excerpt: {
      ar: "هل تبحث عن بديل لـ QuickBooks يناسب بيئة العمل العربية؟ نقارن أشهر البدائل ونوضح لماذا برنامج مبني من الأساس للسوق العربي هو الخيار الأفضل.",
      en: "Looking for a QuickBooks alternative built for the Arab business environment? We compare the top options and explain why MENA-native software wins.",
    },
    content: {
      ar: `<h2>لماذا يبحث أصحاب الأعمال العرب عن بديل لـ QuickBooks؟</h2>
<p>QuickBooks الأشهر عالمياً لكنه يعاني من مشاكل جوهرية في السوق العربي: واجهة مترجمة وليست عربية حقيقية، لا يدعم ZATCA أو ETA، وتكلفته مرتفعة بالدولار مع دعم فني بالإنجليزي فقط.</p>
<h2>مقارنة سريعة</h2>
<table><thead><tr><th>الميزة</th><th>QuickBooks</th><th>Zoho Books</th><th>محاسب اي</th></tr></thead>
<tbody>
<tr><td>واجهة عربية حقيقية</td><td>❌</td><td>جزئي</td><td>✅</td></tr>
<tr><td>فاتورة ZATCA</td><td>❌</td><td>❌</td><td>✅</td></tr>
<tr><td>فاتورة ETA (مصر)</td><td>❌</td><td>❌</td><td>✅</td></tr>
<tr><td>ذكاء اصطناعي لقراءة الفواتير</td><td>❌</td><td>❌</td><td>✅</td></tr>
<tr><td>تجربة مجانية</td><td>30 يوم</td><td>14 يوم</td><td>35 يوم</td></tr>
</tbody></table>
<h2>الخلاصة</h2>
<p>إذا كنت تبحث عن بديل يفهم السوق العربي فعلاً، فإن <strong>محاسب اي</strong> هو الخيار الأنسب. <a href="/register">جرّبه مجاناً 35 يوماً</a>.</p>`,
      en: `<h2>Why Arab Business Owners Seek a QuickBooks Alternative</h2>
<p>QuickBooks is popular globally but fails Arab users: no native Arabic UI, no ZATCA/ETA compliance, USD-only pricing, English-only support.</p>
<h2>Quick Comparison</h2>
<table><thead><tr><th>Feature</th><th>QuickBooks</th><th>Zoho Books</th><th>MohasabAI</th></tr></thead>
<tbody>
<tr><td>Native Arabic UI</td><td>❌</td><td>Partial</td><td>✅</td></tr>
<tr><td>ZATCA Invoice</td><td>❌</td><td>❌</td><td>✅</td></tr>
<tr><td>ETA Invoice (Egypt)</td><td>❌</td><td>❌</td><td>✅</td></tr>
<tr><td>AI Invoice Reading</td><td>❌</td><td>❌</td><td>✅</td></tr>
<tr><td>Free Trial</td><td>30 days</td><td>14 days</td><td>35 days</td></tr>
</tbody></table>
<h2>Conclusion</h2>
<p>For a QuickBooks alternative that genuinely understands the Arab market, <strong>MohasabAI</strong> is the right choice. <a href="/register">Try it free for 35 days</a>.</p>`,
    },
  },
  {
    slug: "كيف-تحسب-ضريبة-القيمة-المضافة",
    date: "2026-02-01",
    readMinutes: 5,
    category: { ar: "ضرائب", en: "Tax" },
    title: {
      ar: "كيف تحسب ضريبة القيمة المضافة في السعودية ومصر والإمارات",
      en: "How to Calculate VAT in Saudi Arabia, Egypt & UAE",
    },
    excerpt: {
      ar: "دليل عملي لحساب ضريبة القيمة المضافة (15% في السعودية، 14% في مصر، 5% في الإمارات) مع أمثلة عملية على كل حالة.",
      en: "A practical guide to calculating VAT across MENA — 15% in Saudi Arabia, 14% in Egypt, 5% in UAE — with worked examples.",
    },
    content: {
      ar: `<h2>نسب ضريبة القيمة المضافة</h2>
<ul><li><strong>السعودية:</strong> 15%</li><li><strong>مصر:</strong> 14%</li><li><strong>الإمارات:</strong> 5%</li><li><strong>الأردن:</strong> 16%</li><li><strong>البحرين:</strong> 10%</li></ul>
<h2>كيف تحسب الضريبة؟</h2>
<p><strong>الضريبة = السعر قبل الضريبة × نسبة الضريبة</strong></p>
<p>مثال سعودي: 1,000 ريال × 15% = 150 ريال ضريبة → الإجمالي 1,150 ريال</p>
<p>مثال مصري: 5,000 جنيه × 14% = 700 جنيه ضريبة → الإجمالي 5,700 جنيه</p>
<h2>استخراج الضريبة من سعر شامل</h2>
<p>الضريبة = السعر الشامل ÷ (1 + نسبة الضريبة) × نسبة الضريبة</p>
<p>مثال: 1,150 ريال ÷ 1.15 × 0.15 = 150 ريال</p>
<h2>محاسب اي يحسبها تلقائياً</h2>
<p>محاسب اي يحسب ضريبة القيمة المضافة على كل فاتورة بناءً على دولتك ويُعدّ الإقرار الضريبي جاهزاً. <a href="/register">جرّبه مجاناً</a>.</p>`,
      en: `<h2>VAT Rates Across MENA</h2>
<ul><li>Saudi Arabia: 15%</li><li>Egypt: 14%</li><li>UAE: 5%</li><li>Jordan: 16%</li><li>Bahrain: 10%</li></ul>
<h2>How to Calculate VAT</h2>
<p>VAT = Pre-tax Price × VAT Rate</p>
<p>Saudi example: SAR 1,000 × 15% = SAR 150 tax → Total SAR 1,150</p>
<p>Egypt example: EGP 5,000 × 14% = EGP 700 tax → Total EGP 5,700</p>
<h2>Extracting VAT from an Inclusive Price</h2>
<p>VAT = Inclusive Price ÷ (1 + Rate) × Rate</p>
<h2>MohasabAI Auto-Calculates VAT</h2>
<p>MohasabAI calculates VAT on every invoice for your country and prepares your periodic return. <a href="/register">Try it free</a>.</p>`,
    },
  },
  {
    slug: "محاسبة-الشركات-الناشئة-دليل-المؤسسين",
    date: "2026-02-15",
    readMinutes: 8,
    category: { ar: "ريادة الأعمال", en: "Entrepreneurship" },
    title: {
      ar: "محاسبة الشركات الناشئة — دليل كامل لكل مؤسس",
      en: "Startup Accounting — A Complete Guide for Every Founder",
    },
    excerpt: {
      ar: "لا تحتاج خبرة محاسبية لإدارة حسابات شركتك الناشئة. هذا الدليل يشرح الأساسيات: دليل الحسابات، القوائم المالية، والأخطاء الشائعة التي تُكلّف الشركات.",
      en: "You don't need accounting expertise to manage your startup's books. This guide covers the essentials: chart of accounts, financial statements, and common costly mistakes.",
    },
    content: {
      ar: `<h2>لماذا تُهمل معظم الشركات الناشئة المحاسبة؟</h2>
<p>المستثمرون يطلبون القوائم المالية قبل أي استثمار. البنوك تطلبها للقروض. ومصلحة الضرائب لا تنتظر. تأجيل المحاسبة هو أحد أكثر الأخطاء تكلفةً في عالم الشركات الناشئة.</p>
<h2>الأساسيات الثلاثة</h2>
<h3>1. دليل الحسابات</h3>
<p>قائمة منظمة بحسابات شركتك: أصول، خصوم، حقوق ملكية، إيرادات، ومصروفات.</p>
<h3>2. القوائم المالية الثلاث</h3>
<ul><li>قائمة الدخل: الإيرادات − المصروفات = الربح أو الخسارة</li><li>الميزانية العمومية: الأصول = الخصوم + حقوق الملكية</li><li>قائمة التدفقات النقدية</li></ul>
<h2>أخطاء شائعة</h2>
<ul><li>❌ خلط الأموال الشخصية بأموال الشركة</li><li>❌ الاعتماد على Excel فقط</li><li>❌ نسيان توفير مبالغ للضرائب</li></ul>
<h2>كيف يُساعدك محاسب اي؟</h2>
<p>يُعدّ دليل الحسابات تلقائياً، يقرأ فواتيرك بالذكاء الاصطناعي، ويُنشئ القوائم المالية في أي وقت. <a href="/register">ابدأ مجاناً</a>.</p>`,
      en: `<h2>Why Most Startups Neglect Accounting</h2>
<p>Investors demand financials before investing. Banks require them for loans. Tax authorities don't wait. Delaying accounting is one of the most costly startup mistakes.</p>
<h2>The Three Essentials</h2>
<ul><li><strong>Income Statement:</strong> Revenue − Expenses = Profit or Loss</li><li><strong>Balance Sheet:</strong> Assets = Liabilities + Equity</li><li><strong>Cash Flow Statement:</strong> Money in and out</li></ul>
<h2>Common Mistakes</h2>
<ul><li>❌ Mixing personal and business finances</li><li>❌ Relying only on Excel</li><li>❌ Forgetting tax provisions</li></ul>
<h2>How MohasabAI Helps</h2>
<p>Auto-creates your chart of accounts, reads invoices with AI, generates all three statements on demand. <a href="/register">Start free</a>.</p>`,
    },
  },
  {
    slug: "الفرق-بين-المدين-والدائن",
    date: "2026-03-01",
    readMinutes: 5,
    category: { ar: "محاسبة", en: "Accounting" },
    title: {
      ar: "الفرق بين المدين والدائن في المحاسبة — شرح مبسط",
      en: "Debit vs Credit in Accounting — A Simple Explanation",
    },
    excerpt: {
      ar: "يربك الكثير من أصحاب الأعمال الفرق بين المدين والدائن. نشرح الفكرة بأمثلة واقعية من العمليات اليومية — بدون مصطلحات معقدة.",
      en: "Many business owners find debit vs. credit confusing. We explain it with real-world daily transaction examples — no jargon.",
    },
    content: {
      ar: `<h2>القاعدة الذهبية</h2>
<p><strong>مجموع المدين = مجموع الدائن في كل قيد دائماً.</strong></p>
<h2>تأثير المدين والدائن على كل نوع حساب</h2>
<table><thead><tr><th>نوع الحساب</th><th>المدين</th><th>الدائن</th></tr></thead>
<tbody>
<tr><td>الأصول</td><td>زيادة ↑</td><td>نقصان ↓</td></tr>
<tr><td>الخصوم</td><td>نقصان ↓</td><td>زيادة ↑</td></tr>
<tr><td>الإيرادات</td><td>نقصان ↓</td><td>زيادة ↑</td></tr>
<tr><td>المصروفات</td><td>زيادة ↑</td><td>نقصان ↓</td></tr>
</tbody></table>
<h2>أمثلة</h2>
<p>بيع نقدي 500 ريال: مدين النقدية 500 / دائن الإيرادات 500</p>
<p>شراء معدات بالآجل 2,000 ريال: مدين المعدات 2,000 / دائن الدائنون 2,000</p>
<p>دفع إيجار 1,500 ريال: مدين مصروف الإيجار 1,500 / دائن النقدية 1,500</p>
<h2>محاسب اي يتكفل بالقيود تلقائياً</h2>
<p>الذكاء الاصطناعي يقترح القيود الصحيحة وأنت تراجع فقط. <a href="/register">جرّبه مجاناً</a>.</p>`,
      en: `<h2>The Golden Rule</h2>
<p><strong>Total Debits = Total Credits in every entry, always.</strong></p>
<h2>Effect on Each Account Type</h2>
<table><thead><tr><th>Account Type</th><th>Debit</th><th>Credit</th></tr></thead>
<tbody>
<tr><td>Assets</td><td>Increase ↑</td><td>Decrease ↓</td></tr>
<tr><td>Liabilities</td><td>Decrease ↓</td><td>Increase ↑</td></tr>
<tr><td>Revenue</td><td>Decrease ↓</td><td>Increase ↑</td></tr>
<tr><td>Expenses</td><td>Increase ↑</td><td>Decrease ↓</td></tr>
</tbody></table>
<h2>Examples</h2>
<p>Cash sale SAR 500: Debit Cash 500 / Credit Revenue 500</p>
<p>Buy equipment on credit SAR 2,000: Debit Equipment 2,000 / Credit Payable 2,000</p>
<p>Pay rent SAR 1,500: Debit Rent Expense 1,500 / Credit Cash 1,500</p>
<h2>MohasabAI Suggests the Right Entries</h2>
<p>The AI proposes journal entries automatically — you just review and confirm. <a href="/register">Try it free</a>.</p>`,
    },
  },
  {
    slug: "كيفية-عمل-ميزانية-للشركة",
    date: "2026-03-15",
    readMinutes: 6,
    category: { ar: "تخطيط مالي", en: "Financial Planning" },
    title: {
      ar: "كيفية عمل ميزانية للشركة — دليل عملي خطوة بخطوة",
      en: "How to Create a Business Budget — A Practical Step-by-Step Guide",
    },
    excerpt: {
      ar: "الميزانية التشغيلية هي خارطة الطريق المالية لشركتك. نشرح كيف تبني ميزانية واقعية خطوة بخطوة لأي حجم عمل.",
      en: "A business budget is your financial roadmap. We walk you through building a realistic budget step by step for any business size.",
    },
    content: {
      ar: `<h2>لماذا الشركات الصغيرة تحتاج ميزانية أكثر من الكبيرة؟</h2>
<p>هامش الخطأ لدى الشركات الصغيرة أضيق. بدون ميزانية، لا تعرف متى ستنفد السيولة ولا ما هو الحد الأدنى للمبيعات لتغطية التكاليف.</p>
<h2>الخطوات الست</h2>
<p><strong>1.</strong> اجمع بيانات 12 شهراً الماضية أو استخدم تقديرات السوق.</p>
<p><strong>2.</strong> حدد التكاليف الثابتة: إيجار، رواتب، اشتراكات.</p>
<p><strong>3.</strong> قدّر التكاليف المتغيرة: تكلفة البضاعة، تسويق، عمالة إضافية.</p>
<p><strong>4.</strong> احسب نقطة التعادل = التكاليف الثابتة ÷ هامش المساهمة للوحدة.</p>
<p><strong>5.</strong> ضع 3 سيناريوهات: متفائل، واقعي، متحفظ.</p>
<p><strong>6.</strong> راجع شهرياً وقارن الفعلي بالمخطط.</p>
<h2>كيف يُساعدك محاسب اي؟</h2>
<p>يُعدّ تقارير الإيرادات والمصروفات الشهرية تلقائياً لمقارنة الأداء بأهدافك. <a href="/register">ابدأ مجاناً</a>.</p>`,
      en: `<h2>Why Small Businesses Need Budgets More</h2>
<p>Their margin for error is smallest. Without a budget, you don't know when cash runs out or the minimum sales to cover costs.</p>
<h2>Six Steps</h2>
<p><strong>1.</strong> Gather 12 months of data or market-based estimates.</p>
<p><strong>2.</strong> Identify fixed costs: rent, core salaries, subscriptions.</p>
<p><strong>3.</strong> Estimate variable costs: COGS, marketing, extra labor.</p>
<p><strong>4.</strong> Calculate break-even = Fixed Costs ÷ Contribution Margin Per Unit.</p>
<p><strong>5.</strong> Build 3 scenarios: optimistic, realistic, conservative.</p>
<p><strong>6.</strong> Review monthly — actual vs. planned.</p>
<h2>How MohasabAI Helps</h2>
<p>Auto-generates monthly revenue and expense reports so you can track actual vs. target at any time. <a href="/register">Start free</a>.</p>`,
    },
  },
];