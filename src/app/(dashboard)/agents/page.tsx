"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { isSuperAdmin } from "@/lib/admin";

// ─── Agent definitions ────────────────────────────────────────────────────────

const AGENTS = {
  ceo: {
    emoji: "👔",
    color: "#F5A623",
    labelAr: "الرئيس التنفيذي",
    labelEn: "CEO",
    roleAr: "المدير التنفيذي",
    roleEn: "Executive Director",
    descAr: "يطرح السؤال على الأقسام المناسبة ويجمع الإجابات",
    descEn: "Delegates to the right departments and synthesizes answers",
  },
  marketing: {
    emoji: "📢",
    color: "#A78BFA",
    labelAr: "التسويق",
    labelEn: "Marketing",
    roleAr: "النمو والعلامة التجارية",
    roleEn: "Growth & Brand",
    descAr: "استراتيجية التسويق، المحتوى، وسائل التواصل، الحملات",
    descEn: "Strategy, content, social media, campaigns",
  },
  dev: {
    emoji: "⚙️",
    color: "#22D3EE",
    labelAr: "التطوير",
    labelEn: "Development",
    roleAr: "المنتج والتقنية",
    roleEn: "Product & Tech",
    descAr: "الميزات، الخارطة، البنية التقنية، التكاملات",
    descEn: "Features, roadmap, architecture, integrations",
  },
  finance: {
    emoji: "💰",
    color: "#34D399",
    labelAr: "المالية",
    labelEn: "Finance",
    roleAr: "المدير المالي والاستراتيجية",
    roleEn: "CFO & Strategy",
    descAr: "التسعير، الإيرادات، الاقتصاديات، التخطيط المالي",
    descEn: "Pricing, revenue, unit economics, planning",
  },
  design: {
    emoji: "🎨",
    color: "#F472B6",
    labelAr: "التصميم",
    labelEn: "Design",
    roleAr: "تجربة المستخدم والهوية البصرية",
    roleEn: "UX & Visual Brand",
    descAr: "UI/UX، الهوية البصرية، تجربة المستخدم",
    descEn: "UI/UX, brand identity, product experience",
  },
} as const;

type AgentId = keyof typeof AGENTS;

interface Delegation {
  id: AgentId;
  text: string;
}

interface Message {
  role: "user" | "assistant";
  agentId: AgentId;
  content: string;
  delegations?: Delegation[];
}

const QUICK_EN = [
  "What is our Q4 marketing strategy for MENA?",
  "What features should we build next?",
  "How should we price our plans?",
  "How can we improve our brand identity?",
  "What KPIs should we track as a SaaS?",
  "How do we grow from 0 to 1,000 customers?",
];
const QUICK_AR = [
  "ما استراتيجية التسويق للربع الرابع في منطقة MENA؟",
  "ما الميزات التي يجب بناؤها أولاً؟",
  "كيف نسعّر خططنا؟",
  "كيف نحسّن هويتنا التجارية؟",
  "ما مؤشرات الأداء التي نتتبعها كشركة SaaS؟",
  "كيف ننمو من 0 إلى 1000 عميل؟",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [currentAgent, setCurrentAgent] = useState<AgentId>("ceo");
  const [history, setHistory] = useState<Record<AgentId, Message[]>>({
    ceo: [], marketing: [], dev: [], finance: [], design: [],
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Admin guard (client-side mirror of server check) ───────────────────────
  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isSuperAdmin(session.user.email)) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  if (status === "loading" || !session || !isSuperAdmin(session.user.email)) {
    return null;
  }

  const agent = AGENTS[currentAgent];
  const msgs = history[currentAgent];

  // ─── Send ────────────────────────────────────────────────────────────────────
  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }

    const agentId = currentAgent;
    const prevHistory = history[agentId];

    setHistory((h) => ({
      ...h,
      [agentId]: [...h[agentId], { role: "user", agentId, content: msg }],
    }));
    setLoading(true);
    setThinkingText(isAr ? "يفكر…" : "thinking…");

    try {
      if (agentId === "ceo") {
        setThinkingText(isAr ? "يقرأ سؤالك…" : "reading your question…");
      }

      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          message: msg,
          history: prevHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { text: string; delegations: Delegation[] };

      setHistory((h) => ({
        ...h,
        [agentId]: [
          ...h[agentId],
          { role: "assistant", agentId, content: data.text, delegations: data.delegations },
        ],
      }));
    } catch (e) {
      setHistory((h) => ({
        ...h,
        [agentId]: [
          ...h[agentId],
          { role: "assistant", agentId, content: isAr ? "حدث خطأ. يرجى المحاولة مجدداً." : "An error occurred. Please try again." },
        ],
      }));
    } finally {
      setLoading(false);
      setThinkingText("");
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function resize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 110) + "px";
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-[calc(100vh-4rem)] rounded-xl overflow-hidden border border-gray-200 bg-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-e border-gray-100 bg-gray-50 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-bold text-gray-800">
            {isAr ? "فريق MohasabAi التنفيذي" : "MohasabAi Executive"}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {isAr ? "للمدير فقط" : "Admin only"}
          </div>
        </div>

        <div className="px-3 pt-3 pb-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1">
            {isAr ? "القيادة" : "Leadership"}
          </div>
          <AgentItem
            id="ceo"
            active={currentAgent === "ceo"}
            isAr={isAr}
            onClick={() => setCurrentAgent("ceo")}
          />
        </div>

        <div className="px-3 pt-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1">
            {isAr ? "الأقسام" : "Departments"}
          </div>
          {(["marketing", "dev", "finance", "design"] as AgentId[]).map((id) => (
            <AgentItem
              key={id}
              id={id}
              active={currentAgent === id}
              isAr={isAr}
              onClick={() => setCurrentAgent(id)}
            />
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: agent.color + "22", color: agent.color }}
          >
            {agent.emoji}
          </span>
          <div>
            <div className="font-semibold text-gray-900 text-sm">
              {isAr ? agent.labelAr : agent.labelEn}
              <span className="text-gray-400 font-normal mx-1">—</span>
              {isAr ? agent.roleAr : agent.roleEn}
            </div>
            <div className="text-xs text-gray-400">
              {isAr ? agent.descAr : agent.descEn}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {msgs.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-8">
              <span className="text-4xl">{currentAgent === "ceo" ? "🏢" : agent.emoji}</span>
              <h2 className="font-bold text-gray-800 text-lg">
                {currentAgent === "ceo"
                  ? (isAr ? "فريق MohasabAi التنفيذي" : "MohasabAi Executive Team")
                  : (isAr ? `قسم ${agent.labelAr}` : `${agent.labelEn} Department`)}
              </h2>
              <p className="text-sm text-gray-400 max-w-sm">
                {currentAgent === "ceo"
                  ? (isAr
                    ? "اطرح أي سؤال. سيقوم الرئيس التنفيذي باستشارة الأقسام المناسبة وتقديم إجابة موحدة."
                    : "Ask anything. The CEO consults the right departments and gives you a unified answer.")
                  : (isAr ? agent.descAr : agent.descEn)}
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {(isAr ? QUICK_AR : QUICK_EN).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((msg, i) => (
            <ChatMessage key={i} msg={msg} isAr={isAr} />
          ))}

          {loading && (
            <div className="flex gap-3 max-w-2xl">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: agent.color + "22", color: agent.color }}
              >
                {agent.emoji}
              </span>
              <div className="flex items-center gap-2 text-sm text-gray-400 italic pt-1.5">
                <ThinkingDots />
                <span>{thinkingText}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); resize(e.target); }}
              onKeyDown={onKey}
              placeholder={isAr ? "اسأل…" : "Ask anything…"}
              rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-28 min-h-[44px]"
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-xl text-white flex items-center justify-center text-lg font-bold flex-shrink-0 transition-opacity disabled:opacity-40"
              style={{ background: agent.color }}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgentItem({
  id, active, isAr, onClick,
}: { id: AgentId; active: boolean; isAr: boolean; onClick: () => void }) {
  const a = AGENTS[id];
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-1 border text-start transition-all ${
        active
          ? "border-[--c] bg-[--c]/10"
          : "border-transparent hover:bg-gray-100"
      }`}
      style={{ "--c": a.color } as React.CSSProperties}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
        style={{ background: a.color + "22", color: a.color }}
      >
        {a.emoji}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-800 truncate">
          {isAr ? a.labelAr : a.labelEn}
        </div>
        <div className="text-[10px] text-gray-400 truncate">
          {isAr ? a.roleAr : a.roleEn}
        </div>
      </div>
    </button>
  );
}

function ChatMessage({ msg, isAr }: { msg: Message; isAr: boolean }) {
  const a = AGENTS[msg.agentId];
  if (msg.role === "user") {
    return (
      <div className="flex gap-3 justify-end max-w-2xl self-end">
        <div className="bg-blue-600 text-white rounded-xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed max-w-prose">
          {msg.content}
        </div>
        <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm flex-shrink-0 text-blue-500">
          👤
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 max-w-2xl">
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
        style={{ background: a.color + "22", color: a.color }}
      >
        {a.emoji}
      </span>
      <div className="flex flex-col gap-1.5 flex-1">
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded self-start"
          style={{ background: a.color + "22", color: a.color }}
        >
          {isAr ? a.labelAr : a.labelEn}
        </span>

        <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-gray-800">
          {msg.delegations && msg.delegations.length > 0 && (
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-gray-400 mb-2">
                🔀 {isAr ? "تم استشارة:" : "Consulted:"}
              </div>
              {msg.delegations.map((d) => {
                const da = AGENTS[d.id];
                return (
                  <div
                    key={d.id}
                    className="border-l-2 pl-3 mb-2 rounded-r-lg py-1.5 pr-2"
                    style={{
                      borderLeftColor: da.color,
                      background: da.color + "0F",
                    }}
                  >
                    <div
                      className="text-[10px] font-bold uppercase tracking-wide mb-1"
                      style={{ color: da.color }}
                    >
                      {da.emoji} {isAr ? da.labelAr : da.labelEn}
                    </div>
                    <div className="text-xs text-gray-500">{d.text}</div>
                  </div>
                );
              })}
              <div className="text-[11px] font-semibold text-gray-400 mt-3 mb-1">
                📋 {isAr ? "ملخص تنفيذي:" : "Executive summary:"}
              </div>
            </div>
          )}
          <div className="whitespace-pre-wrap">{msg.content}</div>
        </div>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
