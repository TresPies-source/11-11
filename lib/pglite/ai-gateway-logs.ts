import { getDB } from './client';
import { aiGatewayConfig } from '@/config/ai-gateway.config';

export interface GatewayLogRow {
  id: string;
  request_id: string;
  user_id: string | null;
  session_id: string | null;
  task_type: string | null;
  provider_id: string;
  model_id: string;
  request_payload: any;
  response_payload: any;
  latency_ms: number | null;
  cost_usd: string | null;
  status_code: number | null;
  error_message: string | null;
  created_at: string;
}

export interface GatewayLogFilters {
  provider?: string;
  taskType?: string;
  userId?: string;
  sessionId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AggregatedMetrics {
  totalRequests: number;
  avgLatency: number;
  totalCost: number;
  errorRate: number;
  successRate: number;
}

export interface ProviderStats {
  provider_id: string;
  provider_name: string;
  request_count: number;
  success_count: number;
  error_count: number;
  success_rate: number;
  avg_latency: number;
  total_cost: number;
  is_healthy: boolean;
}

export interface TimeSeriesMetrics {
  timestamp: string;
  provider_id: string;
  task_type: string | null;
  request_count: number;
  avg_latency: number;
  total_cost: number;
  error_count: number;
}

/**
 * Fetches gateway logs with optional filtering and pagination.
 */
export async function getGatewayLogs(
  limit: number = 50,
  offset: number = 0,
  filters?: GatewayLogFilters
): Promise<{ logs: GatewayLogRow[]; total: number }> {
  const db = await getDB();

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (filters?.provider) {
    whereConditions.push(`provider_id = $${paramIndex++}`);
    params.push(filters.provider);
  }

  if (filters?.taskType) {
    whereConditions.push(`task_type = $${paramIndex++}`);
    params.push(filters.taskType);
  }

  if (filters?.userId) {
    whereConditions.push(`user_id = $${paramIndex++}`);
    params.push(filters.userId);
  }

  if (filters?.sessionId) {
    whereConditions.push(`session_id = $${paramIndex++}`);
    params.push(filters.sessionId);
  }

  if (filters?.startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(filters.startDate);
  }

  if (filters?.endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  const countResult = await db.query(
    `SELECT COUNT(*) as count FROM ai_gateway_logs ${whereClause}`,
    params
  );

  const total = parseInt((countResult.rows[0] as any).count, 10);

  params.push(limit);
  params.push(offset);

  const result = await db.query(
    `
    SELECT * FROM ai_gateway_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `,
    params
  );

  return {
    logs: result.rows as GatewayLogRow[],
    total,
  };
}

/**
 * Fetches aggregated metrics for a given time range.
 */
export async function getAggregatedMetrics(
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<AggregatedMetrics> {
  const db = await getDB();

  // SECURITY NOTE: String interpolation is safe here because values come from a
  // typed map with predefined string literals, not from user input.
  const intervalMap = {
    '1h': '1 hour',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
  };

  const interval = intervalMap[timeRange];

  const result = await db.query(`
    SELECT 
      COUNT(*) as total_requests,
      AVG(latency_ms) as avg_latency,
      SUM(CAST(cost_usd AS DECIMAL)) as total_cost,
      SUM(CASE WHEN status_code >= 400 OR error_message IS NOT NULL THEN 1 ELSE 0 END) as error_count,
      SUM(CASE WHEN status_code < 400 AND error_message IS NULL THEN 1 ELSE 0 END) as success_count
    FROM ai_gateway_logs
    WHERE created_at >= NOW() - INTERVAL '${interval}'
  `);

  const row = result.rows[0] as any;
  const totalRequests = parseInt(row.total_requests || '0', 10);
  const errorCount = parseInt(row.error_count || '0', 10);
  const successCount = parseInt(row.success_count || '0', 10);

  return {
    totalRequests,
    avgLatency: parseFloat(row.avg_latency || '0'),
    totalCost: parseFloat(row.total_cost || '0'),
    errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
    successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
  };
}

/**
 * Fetches provider statistics including health status.
 */
export async function getProviderStats(
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<ProviderStats[]> {
  const db = await getDB();

  // SECURITY NOTE: String interpolation is safe here because values come from a
  // typed map with predefined string literals, not from user input.
  const intervalMap = {
    '1h': '1 hour',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
  };

  const interval = intervalMap[timeRange];

  const result = await db.query(`
    SELECT 
      l.provider_id,
      p.name as provider_name,
      COUNT(*) as request_count,
      SUM(CASE WHEN l.status_code < 400 AND l.error_message IS NULL THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN l.status_code >= 400 OR l.error_message IS NOT NULL THEN 1 ELSE 0 END) as error_count,
      AVG(l.latency_ms) as avg_latency,
      SUM(CAST(l.cost_usd AS DECIMAL)) as total_cost
    FROM ai_gateway_logs l
    LEFT JOIN ai_providers p ON l.provider_id = p.id
    WHERE l.created_at >= NOW() - INTERVAL '${interval}'
    GROUP BY l.provider_id, p.name
    ORDER BY request_count DESC
  `);

  return result.rows.map((row: any) => {
    const requestCount = parseInt(row.request_count || '0', 10);
    const successCount = parseInt(row.success_count || '0', 10);
    const successRate = requestCount > 0 ? (successCount / requestCount) * 100 : 0;

    return {
      provider_id: row.provider_id,
      provider_name: row.provider_name || row.provider_id,
      request_count: requestCount,
      success_count: successCount,
      error_count: parseInt(row.error_count || '0', 10),
      success_rate: successRate,
      avg_latency: parseFloat(row.avg_latency || '0'),
      total_cost: parseFloat(row.total_cost || '0'),
      is_healthy: successRate >= aiGatewayConfig.monitoring.healthyThreshold,
    };
  });
}

/**
 * Fetches time-series metrics for charting (requests, latency, cost over time).
 * 
 * FUTURE USE: Reserved for advanced dashboard features including:
 * - Time-series line charts showing request volume trends
 * - Latency trends over time by provider
 * - Cost accumulation charts
 * 
 * Currently not used by the dashboard but kept for future implementation.
 */
export async function getTimeSeriesMetrics(
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h',
  groupBy: 'hour' | 'day' = 'hour'
): Promise<TimeSeriesMetrics[]> {
  const db = await getDB();

  // SECURITY NOTE: String interpolation is safe here because values come from
  // typed maps with predefined string literals, not from user input.
  const intervalMap = {
    '1h': '1 hour',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
  };

  const interval = intervalMap[timeRange];

  const truncateMap = {
    hour: 'hour',
    day: 'day',
  };

  const truncate = truncateMap[groupBy];

  const result = await db.query(`
    SELECT 
      DATE_TRUNC('${truncate}', created_at) as timestamp,
      provider_id,
      task_type,
      COUNT(*) as request_count,
      AVG(latency_ms) as avg_latency,
      SUM(CAST(cost_usd AS DECIMAL)) as total_cost,
      SUM(CASE WHEN status_code >= 400 OR error_message IS NOT NULL THEN 1 ELSE 0 END) as error_count
    FROM ai_gateway_logs
    WHERE created_at >= NOW() - INTERVAL '${interval}'
    GROUP BY DATE_TRUNC('${truncate}', created_at), provider_id, task_type
    ORDER BY timestamp DESC, provider_id
  `);

  return result.rows.map((row: any) => ({
    timestamp: row.timestamp,
    provider_id: row.provider_id,
    task_type: row.task_type,
    request_count: parseInt(row.request_count || '0', 10),
    avg_latency: parseFloat(row.avg_latency || '0'),
    total_cost: parseFloat(row.total_cost || '0'),
    error_count: parseInt(row.error_count || '0', 10),
  }));
}

/**
 * Fetches recent errors for debugging.
 * 
 * FUTURE USE: Reserved for advanced dashboard features including:
 * - Dedicated error log viewer
 * - Error rate alerts and notifications
 * - Error pattern analysis
 * 
 * Currently not used by the dashboard but kept for future implementation.
 */
export async function getRecentErrors(limit: number = 20): Promise<GatewayLogRow[]> {
  const db = await getDB();

  const result = await db.query(
    `
    SELECT * FROM ai_gateway_logs
    WHERE error_message IS NOT NULL
    ORDER BY created_at DESC
    LIMIT $1
  `,
    [limit]
  );

  return result.rows as GatewayLogRow[];
}
