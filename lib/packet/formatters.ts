import { DojoPacket } from './schema';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Format DojoPacket as pretty-printed JSON
 */
export function formatAsJSON(packet: DojoPacket): string {
  return JSON.stringify(packet, null, 2);
}

/**
 * Format DojoPacket as human-readable Markdown
 */
export function formatAsMarkdown(packet: DojoPacket): string {
  const lines: string[] = [];
  
  lines.push(`# ${packet.session.title}`);
  lines.push('');
  lines.push(`**Mode:** ${packet.session.mode}  `);
  lines.push(`**Duration:** ${packet.session.duration} minutes  `);
  lines.push(`**Created:** ${new Date(packet.session.created_at).toLocaleString()}  `);
  lines.push(`**Updated:** ${new Date(packet.session.updated_at).toLocaleString()}  `);
  
  if (packet.session.agent_path.length > 0) {
    lines.push(`**Agent Path:** ${packet.session.agent_path.join(' → ')}  `);
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  
  lines.push('## Situation');
  lines.push('');
  lines.push(packet.situation || '_No situation provided_');
  lines.push('');
  
  if (packet.stake) {
    lines.push(`**What's at Stake:** ${packet.stake}`);
    lines.push('');
  }
  
  lines.push('---');
  lines.push('');
  
  if (packet.perspectives.length > 0) {
    lines.push('## Perspectives');
    lines.push('');
    packet.perspectives.forEach((p, i) => {
      const timestamp = new Date(p.timestamp).toLocaleTimeString();
      lines.push(`${i + 1}. ${p.text} _(${p.source}, ${timestamp})_`);
    });
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  
  if (packet.assumptions.length > 0) {
    lines.push('## Assumptions');
    lines.push('');
    packet.assumptions.forEach((a, i) => {
      const status = a.challenged ? '❌ _Challenged_' : '✅ _Held_';
      const timestamp = new Date(a.timestamp).toLocaleTimeString();
      lines.push(`${i + 1}. ${a.text} ${status} _(${timestamp})_`);
    });
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  
  if (packet.decisions.length > 0) {
    lines.push('## Decisions');
    lines.push('');
    packet.decisions.forEach((d, i) => {
      const timestamp = new Date(d.timestamp).toLocaleTimeString();
      lines.push(`### Decision ${i + 1} _(${timestamp})_`);
      lines.push('');
      lines.push(d.text);
      lines.push('');
      lines.push(`**Rationale:** ${d.rationale}`);
      lines.push('');
    });
    lines.push('---');
    lines.push('');
  }
  
  if (packet.next_move.action || packet.next_move.why) {
    lines.push('## Next Move');
    lines.push('');
    
    if (packet.next_move.action) {
      lines.push(`**Action:** ${packet.next_move.action}`);
      lines.push('');
    }
    
    if (packet.next_move.why) {
      lines.push(`**Why:** ${packet.next_move.why}`);
      lines.push('');
    }
    
    if (packet.next_move.smallest_test) {
      lines.push(`**Smallest Test:** ${packet.next_move.smallest_test}`);
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
  }
  
  if (packet.artifacts.length > 0) {
    lines.push('## Artifacts');
    lines.push('');
    packet.artifacts.forEach((artifact, i) => {
      lines.push(`### ${i + 1}. ${artifact.name} _(${artifact.type})_`);
      lines.push('');
      
      if (artifact.url) {
        lines.push(`**URL:** ${artifact.url}`);
        lines.push('');
      }
      
      if (artifact.content) {
        lines.push('```');
        lines.push(artifact.content);
        lines.push('```');
        lines.push('');
      }
    });
    lines.push('---');
    lines.push('');
  }
  
  lines.push('## Session Summary');
  lines.push('');
  lines.push(`- **Total Events:** ${packet.trace_summary.total_events}`);
  lines.push(`- **Agent Transitions:** ${packet.trace_summary.agent_transitions}`);
  lines.push(`- **Cost:** $${packet.trace_summary.cost_total.toFixed(4)}`);
  lines.push(`- **Tokens:** ${packet.trace_summary.tokens_total.toLocaleString()}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`_Exported on ${new Date(packet.metadata.exported_at).toLocaleString()}_`);
  
  return lines.join('\n');
}

/**
 * Format DojoPacket as PDF using manus-md-to-pdf
 * 
 * @returns Buffer containing PDF data
 * @throws Error if PDF generation fails
 */
export async function formatAsPDF(packet: DojoPacket): Promise<Buffer> {
  const markdown = formatAsMarkdown(packet);
  const tempDir = tmpdir();
  const mdPath = join(tempDir, `dojopacket-${packet.session.id}.md`);
  const pdfPath = join(tempDir, `dojopacket-${packet.session.id}.pdf`);
  
  try {
    await writeFile(mdPath, markdown, 'utf8');
    
    try {
      await execAsync(`manus-md-to-pdf "${mdPath}" "${pdfPath}"`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`PDF generation failed: ${errorMessage}`);
    }
    
    const { readFile } = await import('fs/promises');
    const pdfBuffer = await readFile(pdfPath);
    
    await unlink(mdPath).catch(() => {});
    await unlink(pdfPath).catch(() => {});
    
    return pdfBuffer;
  } catch (error) {
    await unlink(mdPath).catch(() => {});
    await unlink(pdfPath).catch(() => {});
    throw error;
  }
}
