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

    // Fetch mapping rules with KPI details
    const { data: mappings, error } = await supabase
      .from('mapping_rules')
      .select(`
        id,
        alias,
        confidence,
        validated,
        created_at,
        kpis!inner(
          id,
          name,
          unit,
          category
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching mappings:', error)
      return NextResponse.json({ error: 'Failed to fetch mappings' }, { status: 500 })
    }

    // Transform data for frontend
    const transformedData = mappings.map((mapping) => ({
      id: mapping.id,
      column: mapping.alias,
      kpi: mapping.kpis.name,
      confidence: Math.round(mapping.confidence * 100), // Convert to percentage
      status: mapping.validated ? 'validated' : 'pending',
      unit: mapping.kpis.unit,
      category: mapping.kpis.category
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, validated } = await request.json()

    if (!id || typeof validated !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Update mapping validation status
    const { data, error } = await supabase
      .from('mapping_rules')
      .update({ validated })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating mapping:', error)
      return NextResponse.json({ error: 'Failed to update mapping' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 