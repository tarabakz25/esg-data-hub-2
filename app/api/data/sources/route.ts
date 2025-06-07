import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch data sources with record counts
    const { data: dataSources, error } = await supabase
      .from('data_sources')
      .select(`
        id,
        name,
        type,
        department,
        created_at,
        updated_at,
        raw_records(count)
      `)

    if (error) {
      console.error('Error fetching data sources:', error)
      return NextResponse.json({ error: 'Failed to fetch data sources' }, { status: 500 })
    }

    // Transform data to include record counts and last update
    const transformedData = await Promise.all(
      dataSources.map(async (source) => {
        // Get latest record upload time
        const { data: latestRecord } = await supabase
          .from('raw_records')
          .select('upload_timestamp')
          .eq('data_source_id', source.id)
          .order('upload_timestamp', { ascending: false })
          .limit(1)
          .single()

        return {
          id: source.id,
          name: source.name,
          type: source.type,
          department: source.department,
          records: source.raw_records?.[0]?.count || 0,
          lastUpdate: latestRecord?.upload_timestamp 
            ? new Date(latestRecord.upload_timestamp).toLocaleDateString('ja-JP')
            : new Date(source.created_at).toLocaleDateString('ja-JP')
        }
      })
    )

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 