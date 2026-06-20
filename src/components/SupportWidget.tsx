"use client";
import { useState, useRef, useEffect } from "react";
import { useLang } from "./LanguageProvider";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTERS_AR = ["كيف أرفع فاتورة؟", "كيف أضيف قيد يدوي؟", "أين تقرير الدخل؟", "كيف أطبع فاتورة؟"];
const STARTERS_EN = ["How do I upload an invoice?", "How do I add a journal entry?", "Where is the income report?", "How do I print an invoice?"];

export default function SupportWidget() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const isAr = lang === "ar";

  useEffect(() => {
    if (open) {
      setUnread(false);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, message: text }),
      });
      const data = await res.json();
      const reply = res.ok ? data.reply : (isAr ? "حدث خطأ، حاول مرة أخرى." : "Something went wrong.");
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (!open) setUnread(true);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: isAr ? "حدث خطأ، حاول مرة أخرى." : "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  }

  const starters = isAr ? STARTERS_AR : STARTERS_EN;

  return (
    <div className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-3">
      {/* نافذة الدردشة */}
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: "480px" }}>
          {/* الرأس */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-white font-semibold text-sm">{isAr ? "دعم محاسبي" : "Mohasabi Support"}</p>
                <p className="text-blue-200 text-xs">{isAr ? "متصل الآن" : "Online now"}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>

          {/* الرسائل */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 shadow-sm">
                  {isAr ? "👋 أهلاً! كيف يمكنني مساعدتك؟" : "👋 Hi! How can I help you?"}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
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
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map((d) => (
                      <div key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* حقل الإدخال */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-3 border-t border-gray-100 flex gap-2 bg-white"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAr ? "اكتب سؤالك..." : "Type your question..."}
              className="input flex-1 text-sm py-2"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary px-3 py-2 text-sm"
            >
              {isAr ? "إرسال" : "Send"}
            </button>
          </form>
        </div>
      )}

      {/* زر الفتح */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 relative"
      >
        {open ? "×" : "💬"}
        {unread && !open && (
          <span className="absolute top-0 end-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  );
}
