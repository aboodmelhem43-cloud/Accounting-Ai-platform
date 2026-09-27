import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const schema = z.object({
  agentId: z.enum(["ceo", "marketing", "dev", "finance", "design"]),
  message: z.string().min(1).max(4000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(20)
    .default([]),
});

const SYSTEMS: Record<string, string> = {
  ceo: `You are the CEO of MohasabAi, an AI-powered accounting SaaS platform for SMBs in the MENA region (Egypt, Saudi Arabia, UAE, Jordan, Lebanon).

Platform overview:
- Stack: Next.js + TypeScript, PostgreSQL/Prisma, Anthropic Claude AI, hosted on Vercel
- Features: AI invoice reading, double-entry ledger, financial reports (Income Statement, Balance Sheet, Trial Balance, Aging), multi-currency, Arabic/English RTL UI, bank accounts, contacts with statement of account export, document storage
- Pricing: Starter $29/mo | Professional $79/mo | Enterprise custom
- Instagram: @mohasabai | Website: mohasabai.com

Your role: When you receive a question, use your department tools to delegate it to the right team(s). Always call at least one department tool. After receiving their responses, synthesize a clear, executive-level reply. Be strategic, decisive, and direct.`,

  marketing: `You are the Head of Marketing at MohasabAi, an AI accounting SaaS for SMBs in MENA (Egypt, Saudi Arabia, UAE, Jordan, Lebanon).
Platform: AI invoice reading, financial reports, multi-currency, Arabic/English. Pricing: Starter $29/mo, Pro $79/mo, Enterprise.
Channels: Instagram @mohasabai, website mohasabai.com.
Give concrete, actionable marketing strategies, content plans, growth tactics, and campaign ideas. Be specific and results-focused.`,

  dev: `You are the Head of Development at MohasabAi.
Stack: Next.js (App Router) + TypeScript, PostgreSQL + Prisma ORM, NextAuth, Anthropic Claude API, Vercel.
Built modules: Invoice management (sales/purchase with AI extraction), Chart of Accounts, Journal, Reports (Income Statement, Balance Sheet, Trial Balance, Aging), Bank Accounts, Contacts + Statement of Account export (PDF/Excel), AI Chat assistant, Document storage, Multi-tenant SaaS architecture.
Give practical technical recommendations, feature roadmap decisions, architecture guidance, and integration plans.`,

  finance: `You are the CFO of MohasabAi, an early-stage SaaS startup.
Business model: Monthly subscriptions — Starter $29/mo, Professional $79/mo, Enterprise custom. Target: SMBs in MENA.
Stage: MVP / early traction phase.
Give data-driven financial analysis, pricing strategy, unit economics, revenue projections, cost structure advice, and fundraising guidance.`,

  design: `You are the Head of Design at MohasabAi.
Brand: Professional, trustworthy, modern. Primary blue (#2563EB), clean white UI. Must support Arabic RTL and English LTR.
Users: Business owners and accountants who need clarity, speed, and trust.
Give UX recommendations, brand guidelines, visual identity improvements, product design strategy, and accessibility considerations.`,
};

const DEPT_TOOLS: Anthropic.Tool[] = [
  {
    name: "ask_marketing",
    description:
      "Consult the Marketing department. Use for: marketing strategy, growth, social media, content, brand, campaigns, user acquisition, MENA market.",
    input_schema: {
      type: "object" as const,
      properties: { question: { type: "string", description: "The specific question for the Marketing team" } },
      required: ["question"],
    },
  },
  {
    name: "ask_dev",
    description:
      "Consult the Development department. Use for: product features, technical architecture, development roadmap, integrations, API, performance, security.",
    input_schema: {
      type: "object" as const,
      properties: { question: { type: "string", description: "The specific question for the Development team" } },
      required: ["question"],
    },
  },
  {
    name: "ask_finance",
    description:
      "Consult the Finance department. Use for: pricing, revenue, costs, unit economics, runway, fundraising, financial projections, SaaS metrics.",
    input_schema: {
      type: "object" as const,
      properties: { question: { type: "string", description: "The specific question for the Finance team" } },
      required: ["question"],
    },
  },
  {
    name: "ask_design",
    description:
      "Consult the Design department. Use for: UI/UX decisions, brand identity, visual design, product experience, design system, accessibility.",
    input_schema: {
      type: "object" as const,
      properties: { question: { type: "string", description: "The specific question for the Design team" } },
      required: ["question"],
    },
  },
];

async function callDept(id: string, question: string): Promise<string> {
  const resp = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: SYSTEMS[id],
    messages: [{ role: "user", content: question }],
  });
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!isSuperAdmin(session.user.email)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { agentId, message, history } = schema.parse(body);

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user" as const, content: message },
  ];

  // Direct department call
  if (agentId !== "ceo") {
    const resp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEMS[agentId],
      messages,
    });
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return NextResponse.json({ text, delegations: [] });
  }

  // CEO with tool-use delegation loop
  const delegations: { id: string; text: string }[] = [];
  let currentMessages = [...messages];

  let resp = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEMS.ceo,
    messages: currentMessages,
    tools: DEPT_TOOLS,
    tool_choice: { type: "auto" },
  });

  while (resp.stop_reason === "tool_use") {
    const assistantMsg: Anthropic.MessageParam = { role: "assistant", content: resp.content };
    currentMessages.push(assistantMsg);

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of resp.content) {
      if (block.type === "tool_use") {
        const deptId = block.name.replace("ask_", "");
        const input = block.input as { question: string };
        const deptText = await callDept(deptId, input.question);
        delegations.push({ id: deptId, text: deptText });
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: deptText });
      }
    }

    currentMessages.push({ role: "user", content: toolResults });

    resp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEMS.ceo,
      messages: currentMessages,
      tools: DEPT_TOOLS,
      tool_choice: { type: "auto" },
    });
  }

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return NextResponse.json({ text, delegations });
}
