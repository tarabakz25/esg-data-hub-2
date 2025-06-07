import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get raw record with data
    const { data: rawRecord, error } = await supabase
      .from('raw_records')
      .select(`
        id,
        original_filename,
        upload_timestamp,
        processed,
        raw_data,
        data_sources!inner(
          id,
          name,
          type
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching raw record:', error)
      return NextResponse.json({ error: 'Raw record not found' }, { status: 404 })
    }

    if (!rawRecord) {
      return NextResponse.json({ error: 'Raw record not found' }, { status: 404 })
    }

    // Transform data for frontend
    const recordCount = Array.isArray(rawRecord.raw_data) ? rawRecord.raw_data.length : 0
    
    let status = 'pending'
    if (rawRecord.processed) {
      status = 'processed'
    }

    const transformedData = {
      id: rawRecord.id,
      filename: rawRecord.original_filename || 'Unknown file',
      source: rawRecord.data_sources.name,
      records: recordCount,
      status,
      uploadTime: new Date(rawRecord.upload_timestamp).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      raw_data: rawRecord.raw_data
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 