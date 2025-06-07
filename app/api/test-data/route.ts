import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'create_test_kpis') {
      // Create test KPIs
      const testKPIs = [
        {
          name: 'CO2排出量',
          description: 'Scope 1, 2, 3の総CO2排出量',
          unit: 'tCO2e',
          category: 'environmental',
          required: true,
          issb_tag: 'ghg_emissions_total'
        },
        {
          name: '売上高',
          description: '年間総売上高',
          unit: '円',
          category: 'governance',
          required: true,
          issb_tag: 'revenue_total'
        },
        {
          name: '従業員数',
          description: '正社員及び契約社員の総数',
          unit: '人',
          category: 'social',
          required: true,
          issb_tag: 'employee_count'
        },
        {
          name: '水使用量',
          description: '事業活動に使用した水の総量',
          unit: 'm³',
          category: 'environmental',
          required: false,
          issb_tag: 'water_consumption'
        },
        {
          name: 'エネルギー使用量',
          description: '電力、ガス等のエネルギー総使用量',
          unit: 'kWh',
          category: 'environmental',
          required: true,
          issb_tag: 'energy_consumption'
        },
        {
          name: '廃棄物量',
          description: '事業活動で発生した廃棄物の総量',
          unit: 'kg',
          category: 'environmental',
          required: false,
          issb_tag: 'waste_generated'
        }
      ]

      const { data: kpiData, error: kpiError } = await supabase
        .from('kpis')
        .insert(testKPIs)
        .select()

      if (kpiError) {
        return NextResponse.json({ error: `Failed to create KPIs: ${kpiError.message}` }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `Created ${kpiData?.length || 0} test KPIs`,
        kpis: kpiData
      })

    } else if (action === 'create_test_raw_record') {
      // First, get a data source
      const { data: dataSources, error: dsError } = await supabase
        .from('data_sources')
        .select('id')
        .limit(1)

      if (dsError || !dataSources || dataSources.length === 0) {
        return NextResponse.json({ error: 'No data sources found. Create a data source first.' }, { status: 400 })
      }

      // Create test raw record with sample data that matches existing KPIs
      const testRawData = [
        {
          "温室効果ガス排出量（スコープ1）": 150.5,
          "温室効果ガス排出量（スコープ2）": 88.2,
          "従業員数": 120,
          "水使用量": 2500,
          "廃棄物発生量": 45.2,
          "女性管理職比率": 25.5,
          "労働災害件数": 2,
          "取締役会の多様性": 40.0
        },
        {
          "温室効果ガス排出量（スコープ1）": 148.2,
          "温室効果ガス排出量（スコープ2）": 85.6,
          "従業員数": 125,
          "水使用量": 2600,
          "廃棄物発生量": 43.1,
          "女性管理職比率": 28.0,
          "労働災害件数": 1,
          "取締役会の多様性": 45.0
        },
        {
          "温室効果ガス排出量（スコープ1）": 152.8,
          "温室効果ガス排出量（スコープ2）": 87.3,
          "従業員数": 122,
          "水使用量": 2550,
          "廃棄物発生量": 44.7,
          "女性管理職比率": 26.5,
          "労働災害件数": 0,
          "取締役会の多様性": 42.5
        }
      ]

      const { data: rawRecord, error: rawError } = await supabase
        .from('raw_records')
        .insert({
          data_source_id: dataSources[0].id,
          raw_data: testRawData,
          original_filename: 'test_esg_data.json',
          processed: false
        })
        .select()
        .single()

      if (rawError) {
        return NextResponse.json({ error: `Failed to create raw record: ${rawError.message}` }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Created test raw record with sample data',
        raw_record: rawRecord
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Test data API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 