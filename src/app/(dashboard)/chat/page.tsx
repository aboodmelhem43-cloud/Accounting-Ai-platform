"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_QUESTIONS = [
  "ما هو ربحي هذا الشهر؟",
  "ما هو أكبر مصروف لديّ؟",
  "كم عدد الفواتير المؤكدة؟",
  "ما هي إجمالي إيراداتي؟",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, message: text }),
      });
      const data = await res.json();
      const reply = res.ok ? data.reply : "حدث خطأ في المعالجة";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "حدث خطأ في الاتصال بالمساعد." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">المساعد المالي الذكي</h1>
        <p className="text-gray-500 text-sm mt-1">
          اسألني عن أرقامك المالية — إجاباتي مبنية على بياناتك الفعلية
        </p>
      </div>

      {/* منطقة المحادثة */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🤖</div>
            <p className="text-gray-500 font-medium">كيف يمكنني مساعدتك اليوم؟</p>
            <p className="text-gray-400 text-sm mt-1">أسئلة سريعة للبدء:</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-sm px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-bl-sm"
                  : "bg-gray-100 text-gray-800 rounded-br-sm"
              }`}
            >
              {msg.role === "assistant" && (
                <span className="text-xs text-gray-400 block mb-1">🤖 محاسبي</span>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-br-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* مربع الإدخال */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        className="mt-4 flex gap-3"
      >
        <input
          type="text"
          className="input flex-1"
          placeholder="اكتب سؤالك المالي هنا..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary px-5" disabled={!input.trim() || loading}>
          إرسال
        </button>
      </form>
    </div>
  );
}
