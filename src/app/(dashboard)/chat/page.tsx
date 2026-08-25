"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import MarkdownMessage from "@/components/MarkdownMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [aiAtLimit, setAiAtLimit] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const starterQuestions = lang === "ar"
    ? ["ما هو ربحي هذا الشهر؟", "ما هو أكبر مصروف لديّ؟", "كم عدد الفواتير المؤكدة؟", "ما هي إجمالي إيراداتي؟"]
    : ["What is my profit this month?", "What is my biggest expense?", "How many confirmed invoices do I have?", "What is my total revenue?"];

  // Load chat history on mount + check AI limit
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/chat/history");
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages ?? []);
        }
      } catch { /* ignore */ } finally {
        setHistoryLoading(false);
      }
    }
    async function checkLimit() {
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const data = await res.json();
          const ai = data.ai;
          if (!ai.unlimited && ai.used >= ai.limit) setAiAtLimit(true);
        }
      } catch { /* ignore */ }
    }
    loadHistory();
    checkLimit();
  }, []);

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
        body: JSON.stringify({ messages, message: text, lang }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setMessages((m) => [...m, { role: "assistant", content: data.reply ?? t("common.error") }]);
        return;
      }

      // Stream the response progressively
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const text = accumulated;
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: text }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: t("common.error") }]);
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    setClearing(true);
    try {
      await fetch("/api/chat/history", { method: "DELETE" });
      setMessages([]);
    } catch { /* ignore */ } finally {
      setClearing(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("chat.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lang === "ar"
              ? "اسألني عن أرقامك المالية — إجاباتي مبنية على بياناتك الفعلية"
              : "Ask about your financials — answers are based on your actual data"}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            disabled={clearing}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 mt-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {clearing
              ? (lang === "ar" ? "جاري..." : "Clearing...")
              : (lang === "ar" ? "مسح المحادثة" : "Clear history")}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {historyLoading && (
          <div className="text-center py-8 text-gray-400 text-sm animate-pulse">
            {lang === "ar" ? "جاري تحميل المحادثة..." : "Loading history..."}
          </div>
        )}

        {!historyLoading && messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🤖</div>
            <p className="text-gray-500 font-medium">
              {lang === "ar" ? "كيف يمكنني مساعدتك اليوم؟" : "How can I help you today?"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {lang === "ar" ? "أسئلة سريعة للبدء:" : "Quick questions to get started:"}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {starterQuestions.map((q) => (
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

        {!historyLoading && messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white text-sm rounded-bl-sm whitespace-pre-wrap"
                  : "bg-gray-100 text-gray-800 rounded-br-sm"
              }`}
            >
              {msg.role === "assistant" && (
                <span className="text-xs text-gray-400 block mb-1">🤖 {t("app.name")}</span>
              )}
              {msg.role === "assistant"
                ? <MarkdownMessage content={msg.content} />
                : msg.content}
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

      {aiAtLimit ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {lang === "ar" ? "🚨 وصلت إلى حد استفسارات الذكاء الاصطناعي هذا الشهر" : "🚨 You've reached your AI query limit for this month"}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {lang === "ar" ? "قم بالترقية للحصول على استفسارات غير محدودة" : "Upgrade for unlimited AI queries"}
            </p>
          </div>
          <Link href="/pricing" className="btn-primary flex-shrink-0 text-sm py-2 px-4">
            {lang === "ar" ? "✨ ترقية" : "✨ Upgrade"}
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="mt-4 flex gap-3"
        >
          <input
            type="text"
            className="input flex-1"
            placeholder={t("chat.placeholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-primary px-5" disabled={!input.trim() || loading}>
            {t("chat.send")}
          </button>
        </form>
      )}
    </div>
  );
}
