import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { slackService } from '@/lib/services/slack'

export async function POST(request: NextRequest) {
  try {
    const { kpi_id, period } = await request.json()

    if (!kpi_id || !period) {
      return NextResponse.json(
        { error: 'KPI ID and period are required' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Get KPI details
    const { data: kpi, error: kpiError } = await supabase
      .from('kpis')
      .select('*')
      .eq('id', kpi_id)
      .single()

    if (kpiError || !kpi) {
      return NextResponse.json(
        { error: 'KPI not found' },
        { status: 404 }
      )
    }

    // Get data source information to determine who to notify
    const { data: dataSources, error: dataSourcesError } = await supabase
      .from('data_sources')
      .select('*')
      .eq('department', kpi.category) // Assuming department maps to category

    if (dataSourcesError) {
      console.error('Error fetching data sources:', dataSourcesError)
    }

    // Create reminder record (optional - for tracking purposes)
    const { error: reminderError } = await supabase
      .from('workflow_tasks')
      .insert({
        type: 'review',
        status: 'pending',
        assignee_id: '00000000-0000-0000-0000-000000000000', // System user or specific assignee
        record_id: kpi_id,
        description: `Missing KPI data reminder: ${kpi.name} for period ${period}`
      })

    if (reminderError) {
      console.error('Error creating reminder task:', reminderError)
    }

    // Send Slack notification for the specific missing KPI
    try {
      await slackService.sendMissingKPIAlert([{
        kpi_id: kpi.id,
        kpi_name: kpi.name,
        category: kpi.category,
        urgency: kpi.category === 'environmental' ? 'high' : 
                kpi.category === 'governance' ? 'medium' : 'low',
        last_reported: undefined
      }], period)
    } catch (slackError) {
      console.error('Error sending Slack reminder:', slackError)
      // Don't fail the request if Slack fails
    }

    // TODO: Add email notification functionality here
    // You can integrate with email services like Resend, SendGrid, etc.
    
    return NextResponse.json({
      success: true,
      message: `Reminder sent for KPI: ${kpi.name}`,
      kpi: {
        id: kpi.id,
        name: kpi.name,
        category: kpi.category
      },
      period,
      actions_taken: [
        'Slack notification sent',
        'Workflow task created'
      ]
    })

  } catch (error) {
    console.error('Reminder API error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
} 