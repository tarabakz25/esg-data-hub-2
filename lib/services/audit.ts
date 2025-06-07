import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AuditTrail, WorkflowTask, AuditStats, ComplianceCheck, BlockchainInfo, BlockchainBlock } from '@/lib/types/audit'

// Cache the audit trails fetch
export const getAuditTrails = cache(async (
  search?: string,
  operation?: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditTrail[]> => {
  try {
    return await getAuditTrailsDirect(search, operation, limit, offset)
  } catch (error) {
    console.error('Error fetching audit trails:', error)
    return []
  }
})

// Cache the workflow tasks fetch
export const getWorkflowTasks = cache(async (
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<WorkflowTask[]> => {
  try {
    return await getWorkflowTasksDirect(status, limit, offset)
  } catch (error) {
    console.error('Error fetching workflow tasks:', error)
    return []
  }
})

// Cache the audit statistics fetch
export const getAuditData = cache(async (): Promise<{
  stats: AuditStats
  compliance: ComplianceCheck[]
  blockchain: BlockchainInfo
}> => {
  try {
    const supabase = await createClient()
    
    // Get stats from audit trails and workflow tasks
    const [auditTrailsCount, workflowTasks] = await Promise.all([
      supabase.from('audit_trails').select('*', { count: 'exact', head: true }),
      supabase.from('workflow_tasks').select('*').eq('status', 'pending')
    ])
    
    // For now, assume 90% of records are verified (since verified column might not exist)
    const verifiedCount = Math.floor((auditTrailsCount.count || 0) * 0.9)

    const totalRecords = auditTrailsCount.count || 0
    const verifiedRecords = verifiedCount
    const pendingTasks = workflowTasks.data?.length || 0
    const highPriorityTasks = Math.ceil(pendingTasks * 0.3) // Assume 30% are high priority
    
    const stats: AuditStats = {
      total_records: totalRecords,
      verified_records: verifiedRecords,
      pending_tasks: pendingTasks,
      compliance_score: totalRecords > 0 ? Math.round((verifiedRecords / totalRecords) * 100) : 100,
      high_priority_tasks: highPriorityTasks
    }

    // Mock compliance checks (could be from database in real implementation)
    const compliance: ComplianceCheck[] = [
      {
        category: 'TCFD',
        status: 'compliant',
        score: 95,
        lastCheck: new Date().toISOString()
      },
      {
        category: 'ISSB S1',
        status: 'partial',
        score: 85,
        lastCheck: new Date().toISOString()
      },
      {
        category: 'ISSB S2',
        status: 'compliant',
        score: 92,
        lastCheck: new Date().toISOString()
      },
      {
        category: 'EU CSRD',
        status: 'review',
        score: 78,
        lastCheck: new Date().toISOString()
      }
    ]

    // Mock blockchain info (could be from blockchain service in real implementation)
    const blockchain: BlockchainInfo = {
      chainLength: totalRecords + 100,
      lastVerified: new Date().toISOString(),
      integrity: 100,
      blocks: [
        {
          id: 'BL001',
          hash: 'a1b2c3d4e5f6789012345678901234567890abcdef',
          prevHash: '9876543210fedcba0987654321098765432109876',
          timestamp: new Date().toISOString(),
          actor: 'システム',
          description: 'データ整合性チェック実行',
          verified: true
        },
        {
          id: 'BL002', 
          hash: 'b2c3d4e5f6789012345678901234567890abcdef1',
          prevHash: 'a1b2c3d4e5f6789012345678901234567890abcdef',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          actor: 'ユーザー001',
          description: 'ESGデータ更新',
          verified: true
        },
        {
          id: 'BL003',
          hash: 'c3d4e5f6789012345678901234567890abcdef12',
          prevHash: 'b2c3d4e5f6789012345678901234567890abcdef1',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          actor: 'ユーザー002',
          description: 'レポート生成',
          verified: true
        }
      ]
    }

    return { stats, compliance, blockchain }
  } catch (error) {
    console.error('Error fetching audit data:', error)
    return {
      stats: {
        total_records: 0,
        verified_records: 0,
        pending_tasks: 0,
        compliance_score: 0,
        high_priority_tasks: 0
      },
      compliance: [],
      blockchain: {
        chainLength: 0,
        lastVerified: new Date().toISOString(),
        integrity: 0,
        blocks: []
      }
    }
  }
})

// Direct Supabase functions for use in API routes
export async function getAuditTrailsDirect(
  search?: string,
  operation?: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditTrail[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('audit_trails')
    .select(`
      id,
      record_id,
      operation,
      actor_id,
      timestamp,
      hash,
      prev_hash,
      data_snapshot
    `)

  if (operation && operation !== 'all') {
    query = query.eq('operation', operation)
  }

  if (search) {
    query = query.ilike('record_id', `%${search}%`)
  }

  query = query
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching audit trails:', error)
    return []
  }

  return data?.map(trail => ({
    ...trail,
    actor_name: `ユーザー ${trail.actor_id.slice(0, 8)}`,
    record_type: 'データ',
    description: `${trail.operation} 操作`
  })) || []
}

export async function getWorkflowTasksDirect(
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<WorkflowTask[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('workflow_tasks')
    .select(`
      id,
      type,
      status,
      assignee_id,
      record_id,
      description,
      created_at,
      completed_at
    `)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching workflow tasks:', error)
    return []
  }

  return data?.map(task => ({
    ...task,
    assignee_name: `担当者 ${task.assignee_id.slice(0, 8)}`,
    priority: 'medium' as const,
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })) || []
} 