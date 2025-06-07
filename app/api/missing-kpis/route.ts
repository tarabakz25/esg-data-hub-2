import { NextRequest, NextResponse } from 'next/server'
import { dataProcessor } from '@/lib/services/data-processor'
import { slackService } from '@/lib/services/slack'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || new Date().getFullYear().toString()
    const sendAlert = searchParams.get('send_alert') === 'true'

    // Detect missing KPIs
    const missingKPIs = await dataProcessor.detectMissingKPIs(period)

    // Send Slack alert if requested
    if (sendAlert && missingKPIs.length > 0) {
      await slackService.sendMissingKPIAlert(missingKPIs, period)
    }

    return NextResponse.json({
      period,
      missing_kpis: missingKPIs,
      count: missingKPIs.length,
      alert_sent: sendAlert && missingKPIs.length > 0
    })

  } catch (error) {
    console.error('Missing KPIs API error:', error)
    return NextResponse.json(
      { error: 'Failed to detect missing KPIs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { period } = await request.json()

    if (!period) {
      return NextResponse.json(
        { error: 'Period is required' },
        { status: 400 }
      )
    }

    // Detect missing KPIs and send alert
    const missingKPIs = await dataProcessor.detectMissingKPIs(period)
    
    if (missingKPIs.length > 0) {
      await slackService.sendMissingKPIAlert(missingKPIs, period)
    }

    return NextResponse.json({
      success: true,
      period,
      missing_kpis: missingKPIs,
      count: missingKPIs.length,
      alert_sent: missingKPIs.length > 0
    })

  } catch (error) {
    console.error('Missing KPIs POST API error:', error)
    return NextResponse.json(
      { error: 'Failed to process missing KPIs alert' },
      { status: 500 }
    )
  }
} 