"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLang } from "./LanguageProvider";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

// Convert [/path] mentions in AI replies into clickable links
function parseLinks(text: string, onNav: (path: string) => void) {
  const parts = text.split(/(\[\/[^\]]+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\/.+)\]$/);
    if (match) {
      return (
        <button
          key={i}
          onClick={() => onNav(match[1])}
          className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded px-1.5 py-0.5 text-xs font-mono transition-colors"
        >
          {match[1]} ↗
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const STARTERS_AR = [
  "كيف أرفع فاتورة؟",
  "كيف أضيف قيد يدوي؟",
  "أين تقرير الدخل؟",
  "كيف أضيف عميل للمكتب؟",
  "الفرق بين الخطط؟",
  "كيف أسوّي كشف البنك؟",
];

const STARTERS_EN = [
  "How do I upload an invoice?",
  "How do I add a journal entry?",
  "Where is the income report?",
  "How do I add a practice client?",
  "What's the difference between plans?",
  "How does bank reconciliation work?",
];

type Tab = "chat" | "email";
type EmailState = "idle" | "sending" | "sent" | "error";

export default function SupportWidget() {
  const { lang } = useLang();
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");

  const isAr = lang === "ar";
  const plan = session?.user?.plan ?? "FREE_TRIAL";

  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [open, messages]);

  const navigate = useCallback((path: string) => {
    router.push(path);
    setOpen(false);
  }, [router]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStreaming(true);

    // Add an empty assistant message that we'll stream into
    setMessages((m) => [...m, { role: "assistant", content: "", streaming: true }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.slice(-10),
          message: text,
          lang,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const last = m[m.length - 1];
          if (last.role !== "assistant") return m;
          return [...m.slice(0, -1), { ...last, content: last.content + chunk }];
        });
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      // Mark streaming done
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last.role !== "assistant") return m;
        return [...m.slice(0, -1), { ...last, streaming: false }];
      });

      if (!open) setUnread(true);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last.role !== "assistant") return m;
        return [
          ...m.slice(0, -1),
          {
            role: "assistant",
            content: isAr
              ? "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى."
              : "Connection error. Please try again.",
            streaming: false,
          },
        ];
      });
    } finally {
      setStreaming(false);
    }
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (emailState === "sending") return;
    setEmailState("sending");
    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: emailSubject, message: emailMessage }),
      });
      if (res.ok) {
        setEmailState("sent");
        setEmailSubject("");
        setEmailMessage("");
      } else {
        setEmailState("error");
      }
    } catch {
      setEmailState("error");
    }
  }

  const starters = isAr ? STARTERS_AR : STARTERS_EN;

  const headerGradient =
    plan === "BUSINESS"
      ? "bg-gradient-to-r from-purple-600 to-blue-600"
      : "bg-blue-700";

  return (
    <div className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: "560px" }}
        >
          {/* Header */}
          <div className={`px-4 py-3 flex items-center justify-between flex-shrink-0 ${headerGradient}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
                {plan === "BUSINESS" ? "⭐" : "🤖"}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {plan === "BUSINESS"
                    ? (isAr ? "دعم VIP" : "VIP Support")
                    : "MohasabAi Support"}
                </p>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                  {isAr ? "ذكاء اصطناعي · 24/7" : "AI-powered · 24/7"}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>

          {/* VIP card for BUSINESS plan */}
          {plan === "BUSINESS" && (
            <div className="bg-purple-50 border-b border-purple-100 px-4 py-3 flex-shrink-0">
              <p className="text-xs font-semibold text-purple-800 mb-2">
                {isAr ? "⭐ دعم VIP حصري" : "⭐ Exclusive VIP Support"}
              </p>
              <div className="flex gap-2">
                <a
                  href="mailto:vip@mohasabai.com"
                  className="flex-1 bg-purple-600 text-white text-xs py-2 px-3 rounded-lg text-center font-medium hover:bg-purple-700 transition-colors"
                >
                  📧 {isAr ? "بريد VIP" : "VIP Email"}
                </a>
                <a
                  href="https://wa.me/96500000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-600 text-white text-xs py-2 px-3 rounded-lg text-center font-medium hover:bg-green-700 transition-colors"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => setTab("chat")}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                tab === "chat"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🤖 {isAr ? "المساعد الذكي" : "AI Assistant"}
            </button>
            <button
              onClick={() => { setTab("email"); setEmailState("idle"); }}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                tab === "email"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📧 {isAr ? "راسلنا" : "Email Us"}
            </button>
          </div>

          {/* Chat tab */}
          {tab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 shadow-sm">
                      {isAr
                        ? "👋 أهلاً! أنا مساعدك الذكي على مدار الساعة. كيف أساعدك؟"
                        : "👋 Hi! I'm your 24/7 AI assistant. How can I help?"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {starters.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="bg-white border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 me-2">
                        🤖
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant"
                        ? <span className="whitespace-pre-wrap">{parseLinks(msg.content, navigate)}{msg.streaming && <span className="inline-block w-1.5 h-4 bg-gray-400 rounded animate-pulse ms-0.5" />}</span>
                        : <span className="whitespace-pre-wrap">{msg.content}</span>
                      }
                    </div>
                  </div>
                ))}

                <div ref={endRef} />
              </div>

              {plan === "PRO" && (
                <div className="bg-blue-50 border-t border-blue-100 px-4 py-2 flex-shrink-0">
                  <p className="text-xs font-semibold text-blue-700 mb-0.5">
                    {isAr ? "دعم أولوية" : "Priority Support"}
                  </p>
                  <a href="mailto:support@mohasabai.com" className="text-xs text-blue-600 hover:text-blue-800 underline">
                    support@mohasabai.com
                  </a>
                </div>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="p-3 border-t border-gray-100 flex gap-2 bg-white flex-shrink-0"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isAr ? "اكتب سؤالك..." : "Type your question..."}
                  className="input flex-1 text-sm py-2"
                  disabled={streaming}
                  dir="auto"
                />
                {streaming ? (
                  <button
                    type="button"
                    onClick={() => { abortRef.current?.abort(); setStreaming(false); }}
                    className="px-3 py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg"
                  >
                    ■
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="btn-primary px-3 py-2 text-sm"
                  >
                    {isAr ? "↑" : "↑"}
                  </button>
                )}
              </form>
            </>
          )}

          {/* Email tab */}
          {tab === "email" && (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {emailState === "sent" ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✅</div>
                  <p className="text-gray-800 font-semibold text-sm">
                    {isAr ? "تم إرسال رسالتك بنجاح!" : "Message sent successfully!"}
                  </p>
                  <p className="text-gray-500 text-xs max-w-52">
                    {isAr
                      ? "سيتواصل معك فريق الدعم في أقرب وقت. أرسلنا تأكيداً لبريدك."
                      : "Our support team will follow up shortly. A confirmation was sent to your email."}
                  </p>
                  <button
                    onClick={() => setEmailState("idle")}
                    className="btn-secondary text-xs py-1.5 px-4 mt-2"
                  >
                    {isAr ? "إرسال رسالة أخرى" : "Send another message"}
                  </button>
                </div>
              ) : (
                <form onSubmit={sendEmail} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-blue-600 text-sm">📧</span>
                    <span className="text-blue-700 text-xs font-medium">support@mohasabai.com</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {isAr ? "الموضوع" : "Subject"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder={isAr ? "مثال: مشكلة في رفع الفاتورة" : "e.g. Issue with invoice upload"}
                      className="input w-full text-sm py-2"
                      required
                      minLength={2}
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {isAr ? "الرسالة" : "Message"} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder={isAr ? "اشرح مشكلتك أو سؤالك..." : "Describe your issue or question..."}
                      className="input w-full text-sm py-2 resize-none"
                      rows={5}
                      required
                      minLength={10}
                      maxLength={3000}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-end">{emailMessage.length}/3000</p>
                  </div>

                  {emailState === "error" && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      {isAr
                        ? "فشل الإرسال. راسلنا مباشرة على support@mohasabai.com"
                        : "Send failed. Email us directly at support@mohasabai.com"}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={emailState === "sending" || !emailSubject.trim() || !emailMessage.trim()}
                    className="btn-primary w-full text-sm py-2.5"
                  >
                    {emailState === "sending"
                      ? (isAr ? "جاري الإرسال..." : "Sending...")
                      : (isAr ? "إرسال الرسالة" : "Send Message")}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 relative ${
          plan === "BUSINESS"
            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            : "bg-blue-700 hover:bg-blue-800"
        }`}
        aria-label={isAr ? "فتح الدعم" : "Open support"}
      >
        {open ? "×" : "💬"}
        {unread && !open && (
          <span className="absolute top-0 end-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  );
}
