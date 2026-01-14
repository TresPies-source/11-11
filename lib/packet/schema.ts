import { z } from 'zod';

/**
 * DojoPacket v1.0 Schema
 * 
 * Defines the complete structure for portable, shareable Dojo session exports.
 * Based on the Dojo Protocol standard for session data portability.
 */

export const ArtifactSchema = z.object({
  type: z.enum(['file', 'link', 'code', 'image']),
  name: z.string(),
  content: z.string().nullable(),
  url: z.string().nullable(),
});

export const PerspectiveSchema = z.object({
  text: z.string(),
  source: z.enum(['user', 'agent']),
  timestamp: z.string(),
});

export const AssumptionSchema = z.object({
  text: z.string(),
  challenged: z.boolean(),
  timestamp: z.string(),
});

export const DecisionSchema = z.object({
  text: z.string(),
  rationale: z.string(),
  timestamp: z.string(),
});

export const NextMoveSchema = z.object({
  action: z.string(),
  why: z.string(),
  smallest_test: z.string().nullable(),
});

export const TraceSummarySchema = z.object({
  total_events: z.number(),
  agent_transitions: z.number(),
  cost_total: z.number(),
  tokens_total: z.number(),
});

export const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  mode: z.enum(['Mirror', 'Scout', 'Gardener', 'Implementation']),
  duration: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  agent_path: z.array(z.string()),
});

export const MetadataSchema = z.object({
  exported_at: z.string(),
  exported_by: z.string().nullable(),
  format: z.enum(['json', 'markdown', 'pdf']),
});

export const DojoPacketSchema = z.object({
  version: z.literal('1.0'),
  session: SessionSchema,
  situation: z.string(),
  stake: z.string().nullable(),
  perspectives: z.array(PerspectiveSchema),
  assumptions: z.array(AssumptionSchema),
  decisions: z.array(DecisionSchema),
  next_move: NextMoveSchema,
  artifacts: z.array(ArtifactSchema),
  trace_summary: TraceSummarySchema,
  metadata: MetadataSchema,
});

export type Artifact = z.infer<typeof ArtifactSchema>;
export type Perspective = z.infer<typeof PerspectiveSchema>;
export type Assumption = z.infer<typeof AssumptionSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type NextMove = z.infer<typeof NextMoveSchema>;
export type TraceSummary = z.infer<typeof TraceSummarySchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type DojoPacket = z.infer<typeof DojoPacketSchema>;
