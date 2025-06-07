import { NextRequest, NextResponse } from 'next/server'
import { dataProcessor } from '@/lib/services/data-processor'
import { slackService } from '@/lib/services/slack'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (in production, add proper authentication)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentYear = new Date().getFullYear().toString()
    const currentMonth = new Date().getMonth() + 1
    const currentPeriod = `${currentYear}-Q${Math.ceil(currentMonth / 3)}`

    console.log(`Running missing KPI check for period: ${currentPeriod}`)

    // Detect missing KPIs for current period
    const missingKPIs = await dataProcessor.detectMissingKPIs(currentPeriod)

    if (missingKPIs.length > 0) {
      console.log(`Found ${missingKPIs.length} missing KPIs`)
      
      // Send Slack alert
      await slackService.sendMissingKPIAlert(missingKPIs, currentPeriod)
      
      return NextResponse.json({
        success: true,
        period: currentPeriod,
        missing_kpis_count: missingKPIs.length,
        alert_sent: true,
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('No missing KPIs found')
      
      return NextResponse.json({
        success: true,
        period: currentPeriod,
        missing_kpis_count: 0,
        alert_sent: false,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Cron job error:', error)
    
    // Send error notification to Slack
    try {
      await slackService.sendMessage(
        `❌ Missing KPI cron job failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } catch (slackError) {
      console.error('Failed to send error notification to Slack:', slackError)
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 