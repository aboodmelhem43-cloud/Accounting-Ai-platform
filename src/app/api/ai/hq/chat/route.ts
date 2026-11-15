import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import { HQ_AGENTS } from "@/lib/ai/hq-agents";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const hqSchema = z.object({
    agentId: z.string().max(100),
    messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(50),
  });
  const bodyRaw = await req.json().catch(() => null);
  const bodyParsed = hqSchema.safeParse(bodyRaw);
  if (!bodyParsed.success) return new Response("Bad request", { status: 400 });
  const { agentId, messages } = bodyParsed.data;

  const agent = HQ_AGENTS.find((a) => a.id === agentId);
  if (!agent) return new Response("Agent not found", { status: 400 });

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    system: agent.prompt,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
