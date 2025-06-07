import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuditTrail } from '@/lib/types/audit'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const operation = searchParams.get('operation') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for audit trails with user information
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

    // Apply filters
    if (operation !== 'all') {
      query = query.eq('operation', operation)
    }

    // Apply search on record_id if provided
    if (search) {
      query = query.ilike('record_id', `%${search}%`)
    }

    // Apply pagination and ordering
    query = query
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: auditTrails, error } = await query

    if (error) {
      console.error('Error fetching audit trails:', error)
      return NextResponse.json({ error: 'Failed to fetch audit trails' }, { status: 500 })
    }

    // Transform data for frontend - add mock user names for now
    // In a real implementation, you'd join with a users table
    const transformedData: AuditTrail[] = auditTrails.map((trail) => {
      const recordType = trail.data_snapshot?.table_name || 'Unknown'
      const actorName = getActorName(trail.actor_id) // Mock function
      
      return {
        ...trail,
        actor_name: actorName,
        record_type: recordType,
        description: generateDescription(trail),
        verified: true // For now, assume all are verified
      }
    })

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get actor name (mock implementation)
function getActorName(actorId: string): string {
  const mockUsers: Record<string, string> = {
    '00000000-0000-0000-0000-000000000000': 'システム',
    // Add more mock users as needed
  }
  return mockUsers[actorId] || `ユーザー ${actorId.slice(0, 8)}`
}

// Helper function to generate description based on operation and data
function generateDescription(trail: any): string {
  const operation = trail.operation
  const recordType = trail.data_snapshot?.table_name || 'データ'
  
  switch (operation) {
    case 'create':
      return `新規${recordType}を作成`
    case 'update':
      return `${recordType}を更新`
    case 'delete':
      return `${recordType}を削除`
    default:
      return `${recordType}に対する操作`
  }
} 