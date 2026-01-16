/**
 * Types of knowledge artifacts that can be linked in the Knowledge Hub.
 * - session: Dojo conversation session
 * - prompt: Prompt template from the Library
 * - seed: Seed idea from the Garden
 * - file: Workbench file
 */
export type ArtifactType = 'session' | 'prompt' | 'seed' | 'file';

/**
 * Types of relationships that can exist between knowledge artifacts.
 * - extracted_from: Artifact was extracted from source (e.g., Seed extracted from Dojo message)
 * - discussed_in: Artifact was discussed in a session (e.g., Prompt discussed in Dojo)
 * - refined_in: Artifact was refined during a session
 * - created_from: Artifact was created from another artifact (e.g., Prompt created from Workbench file)
 */
export type RelationshipType = 
  | 'extracted_from'
  | 'discussed_in'
  | 'refined_in'
  | 'created_from';

/**
 * Represents a link between two knowledge artifacts.
 * Forms the edges of the knowledge graph.
 */
export interface KnowledgeLink {
  id: string;
  source_type: ArtifactType;
  source_id: string;
  target_type: ArtifactType;
  target_id: string;
  relationship: RelationshipType;
  metadata: Record<string, any>;
  created_at: string;
  user_id: string;
}

/**
 * Data required to create a new knowledge link.
 * Omits auto-generated fields (id, created_at).
 */
export interface KnowledgeLinkInsert {
  source_type: ArtifactType;
  source_id: string;
  target_type: ArtifactType;
  target_id: string;
  relationship: RelationshipType;
  metadata?: Record<string, any>;
  user_id: string;
}

/**
 * Represents a node in the knowledge lineage graph.
 * Contains artifact metadata enriched with relationship information.
 * Used to visualize how artifacts are connected.
 */
export interface LineageNode {
  type: ArtifactType;
  id: string;
  title: string;
  content_preview: string;
  created_at: string;
  relationship?: RelationshipType;
}

/**
 * Request payload for transferring knowledge between artifacts.
 * Used by the SaveArtifactModal when saving Workbench content.
 * 
 * @deprecated This API route interface is deprecated. 
 * Use direct client-side database access instead (PGlite pattern).
 * See ARCHITECTURE.md for details.
 */
export interface TransferRequest {
  source: {
    type: ArtifactType;
    id: string;
  };
  target: {
    type: ArtifactType;
    id?: string;
  };
  content: {
    title?: string;
    content: string;
    description?: string;
    tags?: string[];
    type?: string;
    status?: string;
    visibility?: string;
    why_matters?: string;
    revisit_when?: string;
  };
  create_link?: boolean;
}

/**
 * Response payload from knowledge transfer operations.
 * 
 * @deprecated This API route interface is deprecated.
 * Use direct client-side database access instead (PGlite pattern).
 * See ARCHITECTURE.md for details.
 */
export interface TransferResponse {
  success: boolean;
  target_id: string;
  link_id?: string;
  message?: string;
}
