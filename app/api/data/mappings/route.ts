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

    // Fetch mapping rules and KPIs separately to avoid relationship issues
    const { data: mappingRules, error: mappingError } = await supabase
      .from('mapping_rules')
      .select(`
        id,
        alias,
        confidence,
        validated,
        created_at,
        kpi_id
      `)
      .order('created_at', { ascending: false })

    if (mappingError) {
      console.error('Error fetching mapping rules:', mappingError)
      return NextResponse.json({ error: 'Failed to fetch mapping rules' }, { status: 500 })
    }

    // Get unique KPI IDs
    const kpiIds = [...new Set(mappingRules?.map(mapping => mapping.kpi_id) || [])]
    
    // Fetch KPIs separately
    const { data: kpis, error: kpiError } = await supabase
      .from('kpis')
      .select('id, name, unit, category')
      .in('id', kpiIds)

    if (kpiError) {
      console.error('Error fetching KPIs:', kpiError)
      return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
    }

    // Create a KPI lookup map
    const kpiMap = new Map(kpis?.map(kpi => [kpi.id, kpi]) || [])

    // Combine the data
    const mappings = mappingRules?.map(mapping => ({
      ...mapping,
      kpis: kpiMap.get(mapping.kpi_id)
    })).filter(mapping => mapping.kpis) // Only include mappings with valid KPIs

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
    const supabase = await createClient()
    
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