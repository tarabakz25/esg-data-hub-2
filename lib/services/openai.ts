import OpenAI from 'openai'
import { EmbeddingRequest, EmbeddingResponse, MappingRequest, MappingResponse } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export class OpenAIService {
  private static instance: OpenAIService
  private rateLimitPerMinute: number
  private requestCount: number
  private lastResetTime: number

  constructor() {
    this.rateLimitPerMinute = parseInt(process.env.OPENAI_RATE_LIMIT_PER_MINUTE || '60')
    this.requestCount = 0
    this.lastResetTime = Date.now()
  }

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService()
    }
    return OpenAIService.instance
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceReset = now - this.lastResetTime

    // Reset counter every minute
    if (timeSinceReset >= 60000) {
      this.requestCount = 0
      this.lastResetTime = now
    }

    if (this.requestCount >= this.rateLimitPerMinute) {
      const waitTime = 60000 - timeSinceReset
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    this.requestCount++
  }

  /**
   * Generate embeddings for text using OpenAI's text-embedding-3-large model
   */
  async generateEmbeddings(input: string | string[]): Promise<number[][]> {
    await this.checkRateLimit()

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: input,
        encoding_format: 'float',
      })

      return response.data.map(item => item.embedding)
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw new Error('Failed to generate embeddings')
    }
  }

  /**
   * Generate a single embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text])
    return embeddings[0]
  }

  /**
   * Map column names to KPIs using AI analysis
   */
  async mapColumnToKPI(request: MappingRequest): Promise<MappingResponse> {
    await this.checkRateLimit()

    const prompt = this.buildMappingPrompt(request)

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an ESG data expert. Your task is to map data columns to standardized KPIs based on ISSB (International Sustainability Standards Board) guidelines. 
            
            Available KPI categories:
            - Environmental: GHG emissions (Scope 1, 2, 3), energy consumption, water usage, waste generation
            - Social: employee metrics, diversity, safety, community impact
            - Governance: board composition, ethics, data security, risk management
            
            Respond with a JSON object containing:
            - kpi_id: the most likely KPI identifier
            - confidence: confidence score (0-1)
            - reasoning: brief explanation of the mapping
            - suggested_unit: recommended unit if different from current`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(content) as MappingResponse
    } catch (error) {
      console.error('Error mapping column to KPI:', error)
      throw new Error('Failed to map column to KPI')
    }
  }

  /**
   * Analyze data quality and suggest improvements
   */
  async analyzeDataQuality(data: Record<string, any>[]): Promise<{
    quality_score: number
    issues: string[]
    suggestions: string[]
  }> {
    await this.checkRateLimit()

    const sampleData = data.slice(0, 10) // Analyze first 10 rows
    const prompt = `Analyze the following ESG data for quality issues:

${JSON.stringify(sampleData, null, 2)}

Identify:
1. Missing values
2. Inconsistent formats
3. Outliers
4. Unit inconsistencies
5. Data completeness

Provide a quality score (0-100) and specific recommendations.`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a data quality expert specializing in ESG data. Analyze the provided data and return a JSON response with quality_score, issues array, and suggestions array.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(content)
    } catch (error) {
      console.error('Error analyzing data quality:', error)
      throw new Error('Failed to analyze data quality')
    }
  }

  /**
   * Generate unit conversion suggestions
   */
  async suggestUnitConversion(value: number, fromUnit: string, toUnit: string): Promise<{
    converted_value: number
    conversion_factor: number
    confidence: number
  }> {
    await this.checkRateLimit()

    const prompt = `Convert ${value} from ${fromUnit} to ${toUnit}. 
    
    Common ESG unit conversions:
    - Energy: kWh, MWh, GWh, GJ, TJ
    - Emissions: tCO2e, kgCO2e, MtCO2e
    - Water: m³, liters, gallons
    - Weight: kg, tonnes, pounds
    
    Provide the converted value, conversion factor, and confidence level.`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a unit conversion expert for ESG metrics. Return a JSON object with converted_value, conversion_factor, and confidence (0-1).'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(content)
    } catch (error) {
      console.error('Error converting units:', error)
      throw new Error('Failed to convert units')
    }
  }

  private buildMappingPrompt(request: MappingRequest): string {
    const { column_name, sample_values, context } = request
    
    return `Map this data column to an ESG KPI:

Column Name: "${column_name}"
Sample Values: ${sample_values.slice(0, 5).join(', ')}
${context ? `Context: ${context}` : ''}

Consider:
1. Column name semantics
2. Value patterns and ranges
3. Typical ESG reporting requirements
4. ISSB standard categories

Map to the most appropriate KPI with confidence score.`
  }

  /**
   * Batch process embeddings with rate limiting
   */
  async batchGenerateEmbeddings(texts: string[], batchSize?: number): Promise<number[][]> {
    const size = batchSize || parseInt(process.env.EMBEDDING_BATCH_SIZE || '100')
    const results: number[][] = []

    for (let i = 0; i < texts.length; i += size) {
      const batch = texts.slice(i, i + size)
      const embeddings = await this.generateEmbeddings(batch)
      results.push(...embeddings)
      
      // Add delay between batches to respect rate limits
      if (i + size < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }
}

export const openaiService = OpenAIService.getInstance() 