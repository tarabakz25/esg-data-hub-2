import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditStats, ComplianceCheck, BlockchainInfo } from '@/lib/types/audit'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch audit statistics
    const [auditStats, complianceChecks, blockchainInfo] = await Promise.all([
      getAuditStats(supabase),
      getComplianceChecks(supabase),
      getBlockchainInfo(supabase)
    ])

    return NextResponse.json({
      stats: auditStats,
      compliance: complianceChecks,
      blockchain: blockchainInfo
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getAuditStats(supabase: any): Promise<AuditStats> {
  try {
    // Get total audit records
    const { count: totalRecords, error: totalError } = await supabase
      .from('audit_trails')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    // Get verified records (assume all are verified for now)
    const verifiedRecords = totalRecords || 0

    // Get pending tasks
    const { count: pendingTasks, error: pendingError } = await supabase
      .from('workflow_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (pendingError) throw pendingError

    // Get high priority tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('workflow_tasks')
      .select('*')
      .eq('status', 'pending')

    if (tasksError) throw tasksError

    // Calculate high priority tasks (approval tasks older than 2 days)
    const now = new Date()
    const highPriorityTasks = tasks?.filter(task => {
      const created = new Date(task.created_at)
      const daysSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      return task.type === 'approval' && daysSinceCreated > 2
    }).length || 0

    // Mock compliance score calculation
    const complianceScore = Math.round(((verifiedRecords / Math.max(totalRecords || 1, 1)) * 100 + 85) / 2)

    return {
      total_records: totalRecords || 0,
      verified_records: verifiedRecords,
      pending_tasks: pendingTasks || 0,
      compliance_score: complianceScore,
      high_priority_tasks: highPriorityTasks
    }
  } catch (error) {
    console.error('Error fetching audit stats:', error)
    return {
      total_records: 0,
      verified_records: 0,
      pending_tasks: 0,
      compliance_score: 0,
      high_priority_tasks: 0
    }
  }
}

async function getComplianceChecks(supabase: any): Promise<ComplianceCheck[]> {
  // For now, return mock compliance data
  // In a real implementation, this would come from compliance tracking tables
  return [
    {
      category: 'ISSB S1',
      status: 'compliant',
      score: 95,
      last_check: new Date().toISOString().split('T')[0],
      requirements: ['気候関連開示', '財務情報の透明性'],
      issues: []
    },
    {
      category: 'ISSB S2',
      status: 'partial',
      score: 87,
      last_check: new Date().toISOString().split('T')[0],
      requirements: ['気候関連リスク開示', 'Scope3排出量'],
      issues: ['Scope3排出量の算定方法要見直し']
    },
    {
      category: 'GRI Standards',
      status: 'compliant',
      score: 92,
      last_check: new Date().toISOString().split('T')[0],
      requirements: ['持続可能性報告', 'ステークホルダー参画'],
      issues: []
    },
    {
      category: 'TCFD',
      status: 'non_compliant',
      score: 65,
      last_check: new Date().toISOString().split('T')[0],
      requirements: ['気候関連リスク分析', '定量的影響評価'],
      issues: ['気候関連リスクの定量的分析不足', 'シナリオ分析の詳細化必要']
    }
  ]
}

async function getBlockchainInfo(supabase: any): Promise<BlockchainInfo> {
  try {
    // Get total chain length
    const { count: chainLength, error: lengthError } = await supabase
      .from('audit_trails')
      .select('*', { count: 'exact', head: true })

    if (lengthError) throw lengthError

    // Get latest blocks
    const { data: latestBlocks, error: blocksError } = await supabase
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
      .order('timestamp', { ascending: false })
      .limit(3)

    if (blocksError) throw blocksError

    return {
      chain_length: chainLength || 0,
      last_verification: new Date().toISOString(),
      integrity_percentage: 100, // Mock - assume perfect integrity
      latest_blocks: latestBlocks?.map(block => ({
        ...block,
        actor_name: `ユーザー ${block.actor_id.slice(0, 8)}`,
        record_type: 'Data',
        description: `${block.operation} operation`,
        verified: true
      })) || []
    }
  } catch (error) {
    console.error('Error fetching blockchain info:', error)
    return {
      chain_length: 0,
      last_verification: new Date().toISOString(),
      integrity_percentage: 0,
      latest_blocks: []
    }
  }
} 