import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an AI-powered Portfolio Assistant for a Program Portfolio Management system.

Your role:
- Answer questions about programs, risks, milestones, and strategic objectives
- Provide data-grounded insights about portfolio health
- Help executives understand program status, risks, and strategic alignment

Rules:
- ONLY answer based on the data provided in the context
- If you don't have enough data to answer, say so clearly
- Use markdown formatting for readability (headers, bullets, bold)
- Be concise but thorough
- When referencing programs, include their status and key metrics
- Flag risks and concerns proactively`;

function getModel() {
  const provider = process.env.LLM_PROVIDER || 'openai';

  if (provider === 'anthropic' || provider === 'claude') {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return anthropic('claude-sonnet-4-20250514');
  }

  // Default to OpenAI
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openai('gpt-4o-mini');
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  // TODO: In production, fetch relevant context from Supabase (programs, risks, etc.)
  // and inject it into the system prompt. For now, use the base system prompt.
  // TODO: In production, resolve org_id from auth session and scope queries.

  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages,
  });

  return result.toDataStreamResponse();
}
