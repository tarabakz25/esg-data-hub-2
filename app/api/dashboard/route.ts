import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { DashboardData } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || new Date().getFullYear().toString()

    // Get total records count
    const { count: totalRecords } = await supabase
      .from('raw_records')
      .select('*', { count: 'exact', head: true })

    // Get processed records count
    const { count: processedRecords } = await supabase
      .from('raw_records')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true)

    // Get missing KPIs count for the period
    const { data: requiredKPIs } = await supabase
      .from('kpis')
      .select('id')
      .eq('required', true)

    const { data: reportedKPIs } = await supabase
      .from('norm_records')
      .select('kpi_id')
      .eq('period', period)

    const requiredKPIIds = new Set(requiredKPIs?.map(kpi => kpi.id) || [])
    const reportedKPIIds = new Set(reportedKPIs?.map((r: any) => r.kpi_id) || [])
    const missingKPIs = requiredKPIIds.size - reportedKPIIds.size

    // Calculate data quality score (simplified)
    const qualityScore = processedRecords && totalRecords 
      ? Math.round((processedRecords / totalRecords) * 100)
      : 0

    // Get recent uploads
    const { data: recentUploads } = await supabase
      .from('raw_records')
      .select(`
        id,
        original_filename,
        upload_timestamp,
        processed,
        data_sources (
          name,
          department
        )
      `)
      .order('upload_timestamp', { ascending: false })
      .limit(5)

    // Get pending tasks
    const { data: pendingTasks } = await supabase
      .from('workflow_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)

    const dashboardData: DashboardData = {
      total_records: totalRecords || 0,
      processed_records: processedRecords || 0,
      missing_kpis: missingKPIs,
      data_quality_score: qualityScore,
      recent_uploads: recentUploads || [],
      pending_tasks: pendingTasks || []
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
} 