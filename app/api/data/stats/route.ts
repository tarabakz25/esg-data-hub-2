import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total data sources count
    const { count: totalDataSources, error: dataSourcesError } = await supabase
      .from('data_sources')
      .select('*', { count: 'exact', head: true })

    if (dataSourcesError) {
      console.error('Error counting data sources:', dataSourcesError)
    }

    // Get total processed records count
    const { count: processedRecords, error: processedError } = await supabase
      .from('raw_records')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true)

    if (processedError) {
      console.error('Error counting processed records:', processedError)
    }

    // Get pending records count
    const { count: pendingRecords, error: pendingError } = await supabase
      .from('raw_records')
      .select('*', { count: 'exact', head: true })
      .eq('processed', false)

    if (pendingError) {
      console.error('Error counting pending records:', pendingError)
    }

    // Get total normalized records count
    const { count: normalizedRecords, error: normalizedError } = await supabase
      .from('norm_records')
      .select('*', { count: 'exact', head: true })

    if (normalizedError) {
      console.error('Error counting normalized records:', normalizedError)
    }

    // Get validated mappings count
    const { count: validatedMappings, error: validatedError } = await supabase
      .from('mapping_rules')
      .select('*', { count: 'exact', head: true })
      .eq('validated', true)

    if (validatedError) {
      console.error('Error counting validated mappings:', validatedError)
    }

    // Get total mappings count
    const { count: totalMappings, error: totalMappingsError } = await supabase
      .from('mapping_rules')
      .select('*', { count: 'exact', head: true })

    if (totalMappingsError) {
      console.error('Error counting total mappings:', totalMappingsError)
    }

    // Calculate data quality scores (simplified metrics)
    const completeness = normalizedRecords && processedRecords 
      ? Math.min(100, Math.round((normalizedRecords / (processedRecords || 1)) * 100))
      : 0

    const consistency = validatedMappings && totalMappings
      ? Math.round((validatedMappings / (totalMappings || 1)) * 100)
      : 0

    const accuracy = Math.max(0, Math.min(100, 85 + Math.random() * 10)) // Simulated for demo
    const timeliness = Math.max(0, Math.min(100, 95 + Math.random() * 5)) // Simulated for demo

    const overallQuality = Math.round((completeness + consistency + accuracy + timeliness) / 4)

    // Get recent upload activity for trend calculation
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { count: yesterdayRecords, error: yesterdayError } = await supabase
      .from('raw_records')
      .select('*', { count: 'exact', head: true })
      .gte('upload_timestamp', yesterday.toISOString())

    if (yesterdayError) {
      console.error('Error counting yesterday records:', yesterdayError)
    }

    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    const { count: lastMonthSources, error: lastMonthError } = await supabase
      .from('data_sources')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())

    if (lastMonthError) {
      console.error('Error counting last month sources:', lastMonthError)
    }

    return NextResponse.json({
      overview: {
        totalDataSources: totalDataSources || 0,
        processedRecords: processedRecords || 0,
        pendingRecords: pendingRecords || 0,
        dataQualityScore: overallQuality,
        // Trends
        newSourcesLastMonth: lastMonthSources || 0,
        recordsYesterday: yesterdayRecords || 0
      },
      quality: {
        completeness,
        accuracy,
        consistency,
        timeliness,
        overall: overallQuality
      },
      alerts: [
        // These would be generated based on actual data analysis
        ...(pendingRecords && pendingRecords > 5 ? [{
          type: 'warning',
          title: '処理待ちファイル',
          description: `${pendingRecords}個のファイルが処理待ちです`,
          severity: 'medium'
        }] : []),
        ...(consistency < 80 ? [{
          type: 'error',
          title: 'マッピング検証不足',
          description: 'KPIマッピングの検証が必要です',
          severity: 'high'
        }] : [])
      ]
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 