import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WorkflowTask } from '@/lib/types/audit'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for workflow tasks
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

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching workflow tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch workflow tasks' }, { status: 500 })
    }

    // Transform data for frontend
    const transformedData: WorkflowTask[] = tasks.map((task) => {
      const assigneeName = getAssigneeName(task.assignee_id)
      const priority = calculatePriority(task)
      const dueDate = calculateDueDate(task.created_at, task.type)
      
      return {
        ...task,
        assignee_name: assigneeName,
        priority,
        due_date: dueDate
      }
    })

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('workflow_tasks')
      .update({ 
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating task:', error)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get assignee name (mock implementation)
function getAssigneeName(assigneeId: string): string {
  const mockAssignees: Record<string, string> = {
    '00000000-0000-0000-0000-000000000000': '環境部長',
    '11111111-1111-1111-1111-111111111111': '品質管理者',
    '22222222-2222-2222-2222-222222222222': 'データアナリスト',
  }
  return mockAssignees[assigneeId] || `担当者 ${assigneeId.slice(0, 8)}`
}

// Helper function to calculate priority based on task type and age
function calculatePriority(task: any): 'low' | 'medium' | 'high' {
  const now = new Date()
  const created = new Date(task.created_at)
  const daysSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)

  if (task.type === 'approval' && daysSinceCreated > 2) return 'high'
  if (task.type === 'correction') return 'high'
  if (daysSinceCreated > 5) return 'medium'
  return 'low'
}

// Helper function to calculate due date based on task type
function calculateDueDate(createdAt: string, type: string): string {
  const created = new Date(createdAt)
  const daysToAdd = type === 'approval' ? 3 : type === 'review' ? 5 : 1
  
  const dueDate = new Date(created)
  dueDate.setDate(created.getDate() + daysToAdd)
  
  return dueDate.toISOString().split('T')[0] // Return YYYY-MM-DD format
} 