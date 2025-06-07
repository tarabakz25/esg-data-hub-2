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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const source = searchParams.get('source') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('raw_records')
      .select(`
        id,
        original_filename,
        upload_timestamp,
        processed,
        data_sources!inner(
          id,
          name,
          type
        )
      `)

    // Apply filters
    if (search) {
      query = query.ilike('original_filename', `%${search}%`)
    }
    
    if (source !== 'all') {
      query = query.eq('data_sources.name', source)
    }

    // Apply pagination and ordering
    query = query
      .order('upload_timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: rawRecords, error } = await query

    if (error) {
      console.error('Error fetching raw records:', error)
      return NextResponse.json({ error: 'Failed to fetch raw records' }, { status: 500 })
    }

    // Transform data for frontend
    const transformedData = await Promise.all(
      rawRecords.map(async (record) => {
        // Get record count from raw_data
        const recordCount = Array.isArray(record.raw_data) ? record.raw_data.length : 0

        // Determine status
        let status = 'pending'
        if (record.processed) {
          status = 'processed'
        } else {
          // Check if currently being processed (you might want to add a processing field)
          status = 'processing'
        }

        return {
          id: record.id,
          filename: record.original_filename || 'Unknown file',
          source: record.data_sources.name,
          records: recordCount,
          status,
          uploadTime: new Date(record.upload_timestamp).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      })
    )

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 