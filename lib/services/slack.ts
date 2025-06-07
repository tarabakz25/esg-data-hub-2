import { WebClient } from '@slack/web-api'
import { MissingKPIAlert } from '@/lib/types'

export class SlackService {
  private static instance: SlackService
  private client: WebClient
  private channelId: string

  constructor() {
    this.client = new WebClient(process.env.SLACK_BOT_TOKEN)
    this.channelId = process.env.SLACK_CHANNEL_ID || ''
  }

  static getInstance(): SlackService {
    if (!SlackService.instance) {
      SlackService.instance = new SlackService()
    }
    return SlackService.instance
  }

  /**
   * Send missing KPI alerts to Slack
   */
  async sendMissingKPIAlert(alerts: MissingKPIAlert[], period: string): Promise<void> {
    if (!this.channelId || alerts.length === 0) {
      return
    }

    try {
      const blocks = this.buildMissingKPIBlocks(alerts, period)
      
      await this.client.chat.postMessage({
        channel: this.channelId,
        text: `Missing KPI Alert for ${period}`,
        blocks: blocks
      })
    } catch (error) {
      console.error('Error sending Slack alert:', error)
      throw new Error('Failed to send Slack notification')
    }
  }

  /**
   * Send data processing completion notification
   */
  async sendProcessingComplete(
    recordId: string, 
    processedCount: number, 
    qualityScore: number
  ): Promise<void> {
    if (!this.channelId) {
      return
    }

    try {
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *Data Processing Complete*\n\nRecord ID: \`${recordId}\`\nProcessed Records: ${processedCount}\nQuality Score: ${qualityScore}%`
          }
        }
      ]

      await this.client.chat.postMessage({
        channel: this.channelId,
        text: 'Data Processing Complete',
        blocks: blocks
      })
    } catch (error) {
      console.error('Error sending processing notification:', error)
    }
  }

  /**
   * Send data quality issues alert
   */
  async sendDataQualityAlert(
    recordId: string,
    qualityScore: number,
    issues: string[]
  ): Promise<void> {
    if (!this.channelId || qualityScore > 70) {
      return // Only send alerts for low quality scores
    }

    try {
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⚠️ *Data Quality Alert*\n\nRecord ID: \`${recordId}\`\nQuality Score: ${qualityScore}%`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Issues Found:*\n${issues.map(issue => `• ${issue}`).join('\n')}`
          }
        }
      ]

      await this.client.chat.postMessage({
        channel: this.channelId,
        text: 'Data Quality Alert',
        blocks: blocks
      })
    } catch (error) {
      console.error('Error sending quality alert:', error)
    }
  }

  /**
   * Build Slack blocks for missing KPI alerts
   */
  private buildMissingKPIBlocks(alerts: MissingKPIAlert[], period: string): any[] {
    const urgencyEmoji = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    }

    const groupedAlerts = alerts.reduce((acc, alert) => {
      if (!acc[alert.urgency]) {
        acc[alert.urgency] = []
      }
      acc[alert.urgency].push(alert)
      return acc
    }, {} as Record<string, MissingKPIAlert[]>)

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Missing KPI Alert - ${period}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Found ${alerts.length} missing required KPIs for reporting period ${period}`
        }
      }
    ]

    // Add sections for each urgency level
    Object.entries(groupedAlerts).forEach(([urgency, urgencyAlerts]) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${urgencyEmoji[urgency as keyof typeof urgencyEmoji]} *${urgency.toUpperCase()} Priority*\n${urgencyAlerts.map(alert => `• ${alert.kpi_name} (${alert.category})`).join('\n')}`
        }
      })
    })

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Please ensure all required KPIs are reported to maintain compliance with ISSB standards.'
        }
      ]
    })

    return blocks
  }

  /**
   * Test Slack connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.auth.test()
      return result.ok === true
    } catch (error) {
      console.error('Slack connection test failed:', error)
      return false
    }
  }

  /**
   * Send custom message to Slack
   */
  async sendMessage(text: string, blocks?: any[]): Promise<void> {
    if (!this.channelId) {
      return
    }

    try {
      await this.client.chat.postMessage({
        channel: this.channelId,
        text: text,
        blocks: blocks
      })
    } catch (error) {
      console.error('Error sending Slack message:', error)
      throw new Error('Failed to send Slack message')
    }
  }
}

export const slackService = SlackService.getInstance() 