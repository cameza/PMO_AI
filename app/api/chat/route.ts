import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const DEMO_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

const BASE_SYSTEM_PROMPT = `You are an AI-powered Portfolio Assistant for a Program Portfolio Management system.

Your role:
- Answer questions about programs, risks, milestones, and strategic objectives
- Provide data-grounded insights about portfolio health
- Help executives understand program status, risks, and strategic alignment

Rules:
- ONLY answer based on the data provided in the context below
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

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface ProgramRow {
  id: string;
  name: string;
  status: string;
  owner?: string;
  product_line?: string;
  pipeline_stage?: string;
  launch_date?: string;
  progress?: number;
  last_update?: string;
  description?: string;
}

interface RiskRow {
  id: string;
  program_id: string;
  title: string;
  severity: string;
  description?: string;
  mitigation?: string;
  status?: string;
}

interface MilestoneRow {
  id: string;
  program_id: string;
  name: string;
  due_date?: string;
  completed_date?: string;
  status?: string;
}

async function fetchPortfolioContext(programContext?: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 'Portfolio data unavailable (database not configured).';

  try {
    const [progResp, riskResp, msResp] = await Promise.all([
      supabase.from('programs').select('*').eq('organization_id', DEMO_ORG_ID),
      supabase.from('risks').select('*').eq('organization_id', DEMO_ORG_ID),
      supabase.from('milestones').select('*').eq('organization_id', DEMO_ORG_ID),
    ]);

    const programs: ProgramRow[] = progResp.data || [];
    const risks: RiskRow[] = riskResp.data || [];
    const milestones: MilestoneRow[] = msResp.data || [];

    // Index by program_id
    const risksByProg: Record<string, RiskRow[]> = {};
    for (const r of risks) {
      (risksByProg[r.program_id] ??= []).push(r);
    }
    const msByProg: Record<string, MilestoneRow[]> = {};
    for (const m of milestones) {
      (msByProg[m.program_id] ??= []).push(m);
    }

    // Status summary
    const statusCounts: Record<string, number> = {};
    for (const p of programs) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    }

    const parts: string[] = [];
    parts.push(`=== PORTFOLIO OVERVIEW (${programs.length} programs) ===`);
    parts.push(Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(' | '));
    parts.push('');

    // If specific program context, put it first
    if (programContext) {
      const focused = programs.find(p => p.id === programContext);
      if (focused) {
        parts.push(`=== CURRENT PROGRAM CONTEXT ===`);
        parts.push(formatProgram(focused, risksByProg[focused.id] || [], msByProg[focused.id] || []));
        parts.push('');
      }
    }

    // All programs summary
    parts.push('=== ALL PROGRAMS ===');
    for (const p of programs) {
      parts.push(formatProgram(p, risksByProg[p.id] || [], msByProg[p.id] || []));
      parts.push('');
    }

    // High severity risks across portfolio
    const highRisks = risks.filter(r => r.severity === 'High' && (r.status || 'Open') === 'Open');
    if (highRisks.length > 0) {
      parts.push('=== CRITICAL RISKS (High Severity, Open) ===');
      for (const r of highRisks) {
        const prog = programs.find(p => p.id === r.program_id);
        parts.push(`- [${prog?.name || 'Unknown'}] ${r.title}: ${r.description || 'No description'}`);
        if (r.mitigation) parts.push(`  Mitigation: ${r.mitigation}`);
      }
    }

    return parts.join('\n');
  } catch (err) {
    console.error('Failed to fetch portfolio context:', err);
    return 'Portfolio data temporarily unavailable.';
  }
}

function formatProgram(p: ProgramRow, risks: RiskRow[], milestones: MilestoneRow[]): string {
  const lines = [
    `**${p.name}** (${p.status}) — ${p.product_line || 'N/A'} | ${p.pipeline_stage || 'N/A'}`,
    `  Owner: ${p.owner || 'Unassigned'} | Progress: ${p.progress ?? 0}% | Launch: ${p.launch_date || 'TBD'}`,
  ];
  if (p.last_update) lines.push(`  Latest Update: ${p.last_update}`);
  if (risks.length > 0) {
    lines.push(`  Risks (${risks.length}): ${risks.map(r => `${r.title} [${r.severity}]`).join(', ')}`);
  }
  if (milestones.length > 0) {
    const upcoming = milestones.filter(m => m.status !== 'Completed');
    const completed = milestones.filter(m => m.status === 'Completed');
    lines.push(`  Milestones: ${completed.length}/${milestones.length} completed`);
    if (upcoming.length > 0) {
      lines.push(`  Upcoming: ${upcoming.map(m => `${m.name} (due ${m.due_date || 'TBD'})`).join(', ')}`);
    }
  }
  return lines.join('\n');
}

export async function POST(req: Request) {
  try {
    const { messages, programContext } = await req.json();

    const portfolioData = await fetchPortfolioContext(programContext);

    const systemPrompt = `${BASE_SYSTEM_PROMPT}

--- PORTFOLIO DATA ---
${portfolioData}
--- END PORTFOLIO DATA ---`;

    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('[Chat API Error]', error?.message || error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Chat failed',
        hint: !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY
          ? 'No LLM API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)'
          : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
