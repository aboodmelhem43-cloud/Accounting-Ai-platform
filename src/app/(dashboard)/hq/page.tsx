"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HQ_AGENTS, type HQAgent } from "@/lib/ai/hq-agents";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function markdownToHtml(md: string): string {
  if (!md) return "";
  let h = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
  // simple table: | A | B | → keep as-is wrapped in pre
  return "<p>" + h + "</p>";
}

const SOCIAL_QUICK: { label: string; msg: string }[] = [
  { label: "📅 Content Calendar", msg: "Build my content calendar for this month" },
  { label: "🎬 TikTok Scripts", msg: "Write 5 TikTok scripts about accounting tips" },
  { label: "💰 Ad Copy", msg: "Write Facebook and TikTok ad copy for MohasabAi" },
  { label: "🤝 DM Templates", msg: "Draft reply templates for DMs and comments" },
  { label: "🚀 Campaign", msg: "Plan a product launch campaign for a new feature" },
  { label: "🤳 Influencer Brief", msg: "Write an influencer brief for finance creators in Egypt" },
  { label: "🎯 Growth Strategy", msg: "Build a 90-day Instagram growth strategy for MohasabAi" },
  { label: "📧 Newsletter", msg: "Write an email newsletter about our new AI invoice feature" },
  { label: "🎥 Reels AR", msg: "اكتب سكريبت ريلز عن سهولة المحاسبة مع محاسب Ai" },
  { label: "📊 Analytics", msg: "Analyze our social media performance and give me a full improvement plan" },
];

export default function HQPage() {
  const [activeAgent, setActiveAgent] = useState<HQAgent | null>(null);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeAgent]);

  const selectAgent = (agent: HQAgent) => {
    setActiveAgent(agent);
    setInput("");
  };

  const sendMessage = useCallback(
    async (text?: string) => {
      if (!activeAgent || isStreaming) return;
      const msgText = text ?? input.trim();
      if (!msgText) return;

      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "";

      const agentId = activeAgent.id;
      const userMsg: Message = { role: "user", content: msgText };

      setConversations((prev) => ({
        ...prev,
        [agentId]: [...(prev[agentId] ?? []), userMsg],
      }));

      setIsStreaming(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // placeholder assistant message
      setConversations((prev) => ({
        ...prev,
        [agentId]: [...(prev[agentId] ?? []), { role: "assistant", content: "" }],
      }));

      try {
        const history = [...(conversations[agentId] ?? []), userMsg];
        const res = await fetch("/api/ai/hq/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, messages: history }),
          signal: ctrl.signal,
        });

        if (!res.ok) throw new Error(await res.text());

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setConversations((prev) => {
            const msgs = [...(prev[agentId] ?? [])];
            msgs[msgs.length - 1] = { role: "assistant", content: accumulated };
            return { ...prev, [agentId]: msgs };
          });
        }
      } catch (e: unknown) {
        if ((e as Error).name !== "AbortError") {
          setConversations((prev) => {
            const msgs = [...(prev[agentId] ?? [])];
            msgs[msgs.length - 1] = {
              role: "assistant",
              content: "⚠️ Error connecting to AI. Please try again.",
            };
            return { ...prev, [agentId]: msgs };
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [activeAgent, input, isStreaming, conversations]
  );

  const msgs = activeAgent ? (conversations[activeAgent.id] ?? []) : [];

  return (
    <div className="hq-root">
      <style>{`
        .hq-root {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          /* left accounts for dashboard sidebar (~240px desktop, full-width on mobile) */
          left: 240px;
          display: flex;
          flex-direction: column;
          background: #080a12;
          color: #e2e8f0;
          font-family: 'Inter', -apple-system, sans-serif;
          z-index: 40;
        }
        @media (max-width: 768px) { .hq-root { left: 0; top: 56px; } }
        /* topbar */
        .hq-top {
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px;
          background: rgba(8,10,18,.95);
          border-bottom: 1px solid rgba(99,102,241,.18);
          gap: 12px;
        }
        .hq-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
        .hq-logo-mark {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          background: linear-gradient(135deg,#3b82f6,#6366f1);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; color: #fff;
        }
        .hq-logo-name { font-size: 14px; font-weight: 700; letter-spacing: -.3px; color: #e2e8f0; }
        .hq-logo-name span { color: #818cf8; }
        .hq-live {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #10b981;
          background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.25);
          border-radius: 20px; padding: 3px 10px; display: flex; align-items: center; gap: 5px;
        }
        .hq-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981;
          animation: hqdot 1.5s ease-in-out infinite; }
        @keyframes hqdot { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)} }
        /* body */
        .hq-body { flex: 1; display: flex; overflow: hidden; }
        /* sidebar */
        .hq-sidebar {
          width: 210px; flex-shrink: 0;
          background: #0d1020; border-right: 1px solid rgba(99,102,241,.18);
          display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden;
        }
        .hq-sidebar-lbl {
          font-family: 'Space Mono', monospace; font-size: 9px; color: #475569;
          text-transform: uppercase; letter-spacing: 2px; padding: 14px 14px 6px;
        }
        .hq-agent-btn {
          display: flex; align-items: center; gap: 10px; padding: 11px 14px;
          cursor: pointer; border: none; background: none; color: #94a3b8;
          width: 100%; text-align: left; border-left: 3px solid transparent;
          transition: background .15s, color .15s, border-color .15s;
        }
        .hq-agent-btn:hover { background: #161b30; color: #e2e8f0; }
        .hq-agent-btn.active { background: #161b30; color: #e2e8f0; border-left-color: var(--ac); }
        .hq-agent-icon {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 15px;
          background: rgba(255,255,255,.05); transition: background .15s;
        }
        .hq-agent-btn.active .hq-agent-icon { background: color-mix(in srgb, var(--ac) 15%, transparent); }
        .hq-agent-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hq-agent-role { font-size: 10px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hq-status-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
          background: var(--ac, #6366f1); margin-left: auto;
          animation: hqdot 2s ease-in-out infinite;
        }
        /* main */
        .hq-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        /* agent header */
        .hq-agent-hdr {
          flex-shrink: 0; padding: 12px 20px; border-bottom: 1px solid rgba(99,102,241,.18);
          background: #0d1020; display: flex; align-items: center; gap: 14px;
        }
        .hq-agent-hdr-icon {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 20px;
          background: color-mix(in srgb, var(--ac, #6366f1) 15%, transparent);
          border: 1px solid color-mix(in srgb, var(--ac, #6366f1) 30%, transparent);
        }
        .hq-agent-hdr-name { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
        .hq-agent-hdr-desc { font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hq-thinking {
          font-size: 11px; color: var(--ac, #6366f1);
          display: flex; align-items: center; gap: 4px; margin-left: auto; flex-shrink: 0;
        }
        .hq-td { width: 5px; height: 5px; border-radius: 50%; background: var(--ac, #6366f1);
          animation: hqthink .6s ease-in-out infinite alternate; }
        .hq-td:nth-child(2){animation-delay:.2s} .hq-td:nth-child(3){animation-delay:.4s}
        @keyframes hqthink{from{opacity:.2;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
        /* social tags */
        .hq-social-tags {
          flex-shrink: 0; display: flex; gap: 6px; padding: 8px 20px;
          overflow-x: auto; border-bottom: 1px solid rgba(99,102,241,.18);
          background: #080a12; scrollbar-width: none;
        }
        .hq-social-tags::-webkit-scrollbar { display: none; }
        .hq-stag {
          flex-shrink: 0; font-size: 11px; padding: 4px 11px; border-radius: 20px;
          background: rgba(236,72,153,.1); border: 1px solid rgba(236,72,153,.2);
          color: #f9a8d4; cursor: pointer; white-space: nowrap;
          transition: background .15s, border-color .15s;
        }
        .hq-stag:hover { background: rgba(236,72,153,.2); border-color: rgba(236,72,153,.4); }
        /* messages */
        .hq-messages {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          padding: 20px; display: flex; flex-direction: column; gap: 14px;
          scroll-behavior: smooth;
        }
        .hq-messages::-webkit-scrollbar { width: 4px; }
        .hq-messages::-webkit-scrollbar-thumb { background: #1e2540; border-radius: 4px; }
        /* welcome */
        .hq-welcome {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 14px; text-align: center; padding: 32px; color: #94a3b8;
        }
        .hq-welcome-icon {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg,rgba(59,130,246,.2),rgba(99,102,241,.2));
          border: 1px solid rgba(99,102,241,.3);
          display: flex; align-items: center; justify-content: center; font-size: 30px;
          animation: hqbrain 2.5s ease-in-out infinite;
        }
        @keyframes hqbrain{0%,100%{box-shadow:0 0 20px rgba(99,102,241,.3)}50%{box-shadow:0 0 36px rgba(99,102,241,.5)}}
        .hq-welcome h2 { font-size: 18px; font-weight: 700; color: #e2e8f0; letter-spacing: -.3px; }
        .hq-welcome p { font-size: 13px; max-width: 380px; }
        .hq-qpicks { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 4px; }
        .hq-qpick {
          font-size: 12px; padding: 7px 14px; border-radius: 20px; cursor: pointer;
          background: #161b30; border: 1px solid rgba(99,102,241,.18); color: #94a3b8;
          transition: background .15s, border-color .15s, color .15s;
        }
        .hq-qpick:hover { background: #1e2540; border-color: #6366f1; color: #e2e8f0; }
        /* message bubbles */
        .hq-msg { display: flex; gap: 10px; max-width: 740px; animation: msgin .2s ease; }
        @keyframes msgin{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .hq-msg.user { flex-direction: row-reverse; align-self: flex-end; }
        .hq-msg.assistant { align-self: flex-start; }
        .hq-avatar {
          width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .hq-msg.user .hq-avatar { background: #6366f1; color: #fff; font-size: 11px; font-weight: 700; }
        .hq-msg.assistant .hq-avatar {
          background: color-mix(in srgb, var(--ac, #6366f1) 18%, transparent);
          font-size: 15px;
        }
        .hq-bubble {
          padding: 10px 14px; border-radius: 12px;
          font-size: 13px; line-height: 1.65; max-width: 600px; word-break: break-word;
        }
        .hq-msg.user .hq-bubble { background: #6366f1; color: #fff; border-bottom-right-radius: 4px; }
        .hq-msg.assistant .hq-bubble {
          background: #161b30; color: #e2e8f0; border-bottom-left-radius: 4px;
          border: 1px solid rgba(99,102,241,.14);
        }
        .hq-bubble p { margin-bottom: 8px; }
        .hq-bubble p:last-child { margin-bottom: 0; }
        .hq-bubble strong { color: #e2e8f0; }
        .hq-bubble code {
          font-family: 'Space Mono', monospace; font-size: 11px;
          background: rgba(0,0,0,.3); border-radius: 4px; padding: 1px 5px;
        }
        .hq-cursor { display: inline-block; width: 2px; height: 1em; background: var(--ac,#6366f1); margin-left: 1px; animation: blink .7s step-end infinite; vertical-align: text-bottom; }
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        /* starters */
        .hq-starters { display: flex; flex-wrap: wrap; gap: 7px; padding: 0 40px; }
        .hq-starter {
          font-size: 12px; padding: 6px 13px; border-radius: 20px; cursor: pointer;
          background: rgba(99,102,241,.08); border: 1px solid rgba(99,102,241,.2); color: #94a3b8;
          transition: background .15s; border-color-color: var(--ac,#6366f1);
        }
        .hq-starter:hover { background: rgba(99,102,241,.15); color: #e2e8f0; }
        /* input */
        .hq-input-bar {
          flex-shrink: 0; padding: 12px 20px; border-top: 1px solid rgba(99,102,241,.18);
          background: #0d1020; display: flex; gap: 10px; align-items: flex-end;
        }
        .hq-input-wrap {
          flex: 1; background: #121628; border: 1px solid rgba(99,102,241,.18);
          border-radius: 12px; display: flex; align-items: flex-end;
          transition: border-color .15s;
        }
        .hq-input-wrap:focus-within { border-color: #6366f1; }
        .hq-textarea {
          flex: 1; background: none; border: none; outline: none; color: #e2e8f0;
          font-family: 'Inter', sans-serif; font-size: 13px;
          padding: 10px 14px; resize: none; min-height: 42px; max-height: 140px; line-height: 1.5;
        }
        .hq-textarea::placeholder { color: #475569; }
        .hq-send {
          flex-shrink: 0; width: 36px; height: 36px; margin: 3px;
          background: linear-gradient(135deg,#3b82f6,#6366f1);
          border: none; border-radius: 9px; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center; font-size: 14px;
          transition: opacity .15s;
        }
        .hq-send:disabled { opacity: .4; cursor: not-allowed; }
        .hq-send:not(:disabled):hover { opacity: .85; }
        .hq-hint { font-size: 10px; color: #475569; align-self: center; white-space: nowrap; }
        /* mobile */
        @media (max-width: 640px) {
          .hq-sidebar {
            width: 100%; height: auto; max-height: 120px;
            flex-direction: row; flex-wrap: nowrap;
            overflow-x: auto; overflow-y: hidden;
            border-right: none; border-bottom: 1px solid rgba(99,102,241,.18);
          }
          .hq-sidebar-lbl { display: none; }
          .hq-body { flex-direction: column; }
          .hq-agent-btn { flex-direction: column; align-items: center; text-align: center; min-width: 68px; padding: 8px 6px; border-left: none; border-bottom: 3px solid transparent; }
          .hq-agent-btn.active { border-bottom-color: var(--ac, #6366f1); border-left-color: transparent; }
          .hq-agent-icon { width: 34px; height: 34px; font-size: 16px; }
          .hq-agent-role, .hq-status-dot { display: none; }
          .hq-hint { display: none; }
        }
      `}</style>

      {/* Top bar */}
      <div className="hq-top">
        <a className="hq-logo" href="/dashboard">
          <div className="hq-logo-mark">M</div>
          <span className="hq-logo-name">Mohasab<span>Ai</span> HQ</span>
        </a>
        <div className="hq-live">
          <div className="hq-live-dot" />
          AGENTS LIVE
        </div>
      </div>

      {/* Body */}
      <div className="hq-body">
        {/* Sidebar */}
        <div className="hq-sidebar">
          <div className="hq-sidebar-lbl">Departments</div>
          {HQ_AGENTS.map((agent) => (
            <button
              key={agent.id}
              className={`hq-agent-btn ${activeAgent?.id === agent.id ? "active" : ""}`}
              style={{ "--ac": agent.color } as React.CSSProperties}
              onClick={() => selectAgent(agent)}
            >
              <div className="hq-agent-icon">{agent.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div className="hq-agent-name">{agent.name}</div>
                <div className="hq-agent-role">{agent.role}</div>
              </div>
              <div className="hq-status-dot" />
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="hq-main" style={{ "--ac": activeAgent?.color ?? "#6366f1" } as React.CSSProperties}>
          {activeAgent && (
            <div className="hq-agent-hdr">
              <div className="hq-agent-hdr-icon">{activeAgent.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="hq-agent-hdr-name">{activeAgent.name}</div>
                <div className="hq-agent-hdr-desc">{activeAgent.desc}</div>
              </div>
              {isStreaming && (
                <div className="hq-thinking">
                  <div className="hq-td" /><div className="hq-td" /><div className="hq-td" />
                  thinking…
                </div>
              )}
            </div>
          )}

          {/* Social media quick-action strip */}
          {activeAgent?.id === "social" && (
            <div className="hq-social-tags">
              {SOCIAL_QUICK.map((q) => (
                <button key={q.label} className="hq-stag" onClick={() => sendMessage(q.msg)}>
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {!activeAgent ? (
            <div className="hq-welcome">
              <div className="hq-welcome-icon">🧠</div>
              <h2>MohasabAi HQ</h2>
              <p>Select a department on the left to start chatting with an AI agent. Each agent specializes in its area.</p>
              <div className="hq-qpicks">
                {[
                  { label: "📣 Draft TikTok post", id: "social" },
                  { label: "📒 Create a journal entry", id: "ledger" },
                  { label: "⚖️ Egypt ETA setup", id: "compliance" },
                  { label: "📊 Read my P&L", id: "reports" },
                  { label: "💬 Cash flow tips", id: "chat" },
                ].map((q) => (
                  <button
                    key={q.id}
                    className="hq-qpick"
                    onClick={() => {
                      const ag = HQ_AGENTS.find((a) => a.id === q.id)!;
                      selectAgent(ag);
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="hq-messages">
                {msgs.length === 0 && (
                  <>
                    <div className="hq-msg assistant">
                      <div className="hq-avatar">{activeAgent.icon}</div>
                      <div className="hq-bubble">
                        <p>مرحباً! I&apos;m your <strong>{activeAgent.name}</strong>. I can help you with {activeAgent.role.toLowerCase()} — ask me anything or pick a quick start below.</p>
                      </div>
                    </div>
                    <div className="hq-starters">
                      {activeAgent.starters.map((s) => (
                        <button key={s} className="hq-starter" onClick={() => sendMessage(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {msgs.map((m, i) => (
                  <div key={i} className={`hq-msg ${m.role}`}>
                    <div className="hq-avatar">
                      {m.role === "user" ? "U" : activeAgent.icon}
                    </div>
                    <div className="hq-bubble">
                      {m.role === "assistant" ? (
                        <>
                          <span dangerouslySetInnerHTML={{ __html: markdownToHtml(m.content) }} />
                          {isStreaming && i === msgs.length - 1 && m.content === "" && (
                            <span style={{ color: "#475569" }}>…</span>
                          )}
                          {isStreaming && i === msgs.length - 1 && m.content !== "" && (
                            <span className="hq-cursor" />
                          )}
                        </>
                      ) : (
                        <p>{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="hq-input-bar">
                <div className="hq-input-wrap">
                  <textarea
                    ref={textareaRef}
                    className="hq-textarea"
                    placeholder={`Ask ${activeAgent.name}…`}
                    value={input}
                    disabled={isStreaming}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "";
                      e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    className="hq-send"
                    disabled={!input.trim() || isStreaming}
                    onClick={() => sendMessage()}
                  >
                    ➤
                  </button>
                </div>
                <span className="hq-hint">Enter to send · Shift+Enter for newline</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
