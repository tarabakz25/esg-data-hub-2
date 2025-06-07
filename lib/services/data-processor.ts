import { createServiceClient } from '@/lib/supabase/server'
import { openaiService } from './openai'
import { RawRecord, NormRecord, MappingRule, KPI } from '@/lib/types'
import { Readable } from 'stream'

export class DataProcessorService {
  private static instance: DataProcessorService

  static getInstance(): DataProcessorService {
    if (!DataProcessorService.instance) {
      DataProcessorService.instance = new DataProcessorService()
    }
    return DataProcessorService.instance
  }

  /**
   * Process uploaded CSV file and extract structured data
   */
  async processCSVFile(fileBuffer: Buffer, filename: string): Promise<Record<string, any>[]> {
    // For now, return empty array. In production, implement CSV parsing
    // You'll need to install and import a CSV parser like 'csv-parser' or 'papaparse'
    console.log(`Processing CSV file: ${filename}`)
    return []
  }

  /**
   * Process raw record and create normalized records
   */
  async processRawRecord(rawRecordId: string): Promise<void> {
    const supabase = await createServiceClient()

    try {
      // Get raw record
      const { data: rawRecord, error: rawError } = await supabase
        .from('raw_records')
        .select('*')
        .eq('id', rawRecordId)
        .single()

      if (rawError || !rawRecord) {
        throw new Error(`Raw record not found: ${rawRecordId}`)
      }

      // Get all available KPIs
      const { data: kpis, error: kpisError } = await supabase
        .from('kpis')
        .select('*')

      if (kpisError) {
        throw new Error('Failed to fetch KPIs')
      }

      const rawData = rawRecord.raw_data as Record<string, any>[]
      const normalizedRecords: Omit<NormRecord, 'id' | 'created_at'>[] = []

      // Process each row of data
      for (const row of rawData) {
        const mappedData = await this.mapRowToKPIs(row, kpis || [])
        normalizedRecords.push(...mappedData.map(item => ({
          raw_record_id: rawRecordId,
          kpi_id: item.kpi_id,
          value: item.value,
          unit: item.unit,
          period: item.period || new Date().getFullYear().toString()
        })))
      }

      // Insert normalized records
      if (normalizedRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('norm_records')
          .insert(normalizedRecords)

        if (insertError) {
          throw new Error(`Failed to insert normalized records: ${insertError.message}`)
        }
      }

      // Mark raw record as processed
      const { error: updateError } = await supabase
        .from('raw_records')
        .update({ processed: true })
        .eq('id', rawRecordId)

      if (updateError) {
        throw new Error(`Failed to update raw record: ${updateError.message}`)
      }

    } catch (error) {
      console.error('Error processing raw record:', error)
      throw error
    }
  }

  /**
   * Map a single row of data to KPIs using AI and existing mapping rules
   */
  private async mapRowToKPIs(
    row: Record<string, any>, 
    kpis: KPI[]
  ): Promise<Array<{
    kpi_id: string
    value: number
    unit: string
    period?: string
  }>> {
    const supabase = await createServiceClient()
    const results: Array<{
      kpi_id: string
      value: number
      unit: string
      period?: string
    }> = []

    for (const [columnName, value] of Object.entries(row)) {
      if (value === null || value === undefined || value === '') {
        continue
      }

      // Check for existing mapping rule
      const { data: existingRule } = await supabase
        .from('mapping_rules')
        .select('*')
        .eq('alias', columnName.toLowerCase())
        .eq('validated', true)
        .order('confidence', { ascending: false })
        .limit(1)
        .single()

      let kpiId: string
      let confidence: number

      if (existingRule) {
        kpiId = existingRule.kpi_id
        confidence = existingRule.confidence
      } else {
        // Use AI to map column to KPI
        const mapping = await this.generateColumnMapping(columnName, [value.toString()], kpis)
        if (!mapping || mapping.confidence < 0.7) {
          continue // Skip low confidence mappings
        }

        kpiId = mapping.kpi_id
        confidence = mapping.confidence

        // Store new mapping rule
        await supabase
          .from('mapping_rules')
          .insert({
            alias: columnName.toLowerCase(),
            kpi_id: kpiId,
            confidence: confidence,
            validated: confidence > 0.8
          })
      }

      // Convert value to number and normalize unit
      const numericValue = this.parseNumericValue(value)
      if (numericValue === null) {
        continue
      }

      const kpi = kpis.find(k => k.id === kpiId)
      if (!kpi) {
        continue
      }

      // Detect and convert units if necessary
      const normalizedValue = await this.normalizeValue(numericValue, kpi.unit)

      results.push({
        kpi_id: kpiId,
        value: normalizedValue.value,
        unit: normalizedValue.unit,
        period: this.extractPeriod(row)
      })
    }

    return results
  }

  /**
   * Generate AI-powered column mapping (now public for external use)
   */
  async generateColumnMapping(
    columnName: string, 
    sampleValues: string[], 
    kpis: KPI[]
  ): Promise<{ kpi_id: string; confidence: number } | null> {
    try {
      // Try rule-based mapping first (no API calls)
      const ruleBasedResult = await this.ruleBasedMapping(columnName, sampleValues, kpis)
      if (ruleBasedResult && ruleBasedResult.confidence >= 0.8) {
        console.log(`Rule-based mapping succeeded for ${columnName} with confidence ${ruleBasedResult.confidence}`)
        return ruleBasedResult
      }

      // If rule-based didn't find a good match, try AI strategies
      const aiStrategies = [
        () => this.semanticSimilarityMapping(columnName, sampleValues, kpis),
        () => this.embeddingBasedMapping(columnName, sampleValues, kpis)
      ]

      const results = ruleBasedResult ? [ruleBasedResult] : []

      // Try AI strategies with rate limiting handling
      for (const strategy of aiStrategies) {
        try {
          const result = await strategy()
          if (result) {
            results.push(result)
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
            console.log(`Rate limit hit for ${columnName}, skipping remaining AI strategies`)
            break // Skip remaining AI strategies if rate limited
          }
          console.error('AI strategy failed:', error)
          // Continue with other strategies
        }
      }

      if (results.length === 0) {
        return null
      }

      // Calculate weighted average confidence
      const bestResult = results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      )

      // Boost confidence if multiple strategies agree
      if (results.length > 1) {
        const agreementBonus = results.filter(r => r.kpi_id === bestResult.kpi_id).length * 0.1
        bestResult.confidence = Math.min(1.0, bestResult.confidence + agreementBonus)
      }

      return bestResult

    } catch (error) {
      console.error('Error generating column mapping:', error)
      return null
    }
  }

  /**
   * Semantic similarity mapping using OpenAI
   */
  private async semanticSimilarityMapping(
    columnName: string,
    sampleValues: string[],
    kpis: KPI[]
  ): Promise<{ kpi_id: string; confidence: number } | null> {
    try {
      const kpiOptions = kpis.map(k => `ID: ${k.id}, Name: ${k.name}, Category: ${k.category}, Unit: ${k.unit}`).join('\n')
      
      const request = {
        column_name: columnName,
        sample_values: sampleValues,
        context: `Available KPIs:\n${kpiOptions}`
      }

      const response = await openaiService.mapColumnToKPI(request)
      
      // Validate AI response
      if (!response.kpi_id || typeof response.kpi_id !== 'string') {
        console.log('AI response has no valid kpi_id:', response)
        return null
      }

      // Check if the returned kpi_id exists in our KPI list
      const matchedKPI = kpis.find(kpi => kpi.id === response.kpi_id)

      if (matchedKPI) {
        return {
          kpi_id: matchedKPI.id,
          confidence: Math.min(1, Math.max(0, response.confidence || 0))
        }
      } else {
        console.log(`AI returned unknown KPI ID: ${response.kpi_id}`)
        return null
      }
    } catch (error) {
      console.error('Semantic similarity mapping failed:', error)
      return null
    }
  }

  /**
   * Rule-based mapping using predefined patterns
   */
  private async ruleBasedMapping(
    columnName: string,
    sampleValues: string[],
    kpis: KPI[]
  ): Promise<{ kpi_id: string; confidence: number } | null> {
    const patterns = {
      ghg_scope1: ['scope1', 'スコープ1', '温室効果ガス', 'scope 1', 'co2', 'carbon', 'emission', 'ghg', 'greenhouse', '排出', '炭素'],
      ghg_scope2: ['scope2', 'スコープ2', '温室効果ガス', 'scope 2'],
      water: ['water', 'h2o', 'consumption', 'usage', '水', '使用', '水使用'],
      waste: ['waste', 'garbage', 'trash', 'disposal', '廃棄', 'ゴミ', '廃棄物', '発生'],
      employee: ['employee', 'staff', 'worker', 'personnel', 'headcount', '従業員', '社員', '人数', '人'],
      diversity: ['diversity', 'gender', 'minority', 'inclusion', '多様', '性別', 'ダイバーシティ', '女性', '管理職', '比率'],
      safety: ['safety', 'accident', 'incident', 'injury', '安全', '事故', '災害', '労働災害', '件数'],
      governance: ['governance', 'board', 'director', '取締役', '取締役会', 'ガバナンス', '多様性']
    }

    const columnLower = columnName.toLowerCase()
    
    // First try exact name matches
    for (const kpi of kpis) {
      const kpiNameLower = kpi.name.toLowerCase()
      if (kpiNameLower === columnLower || 
          kpiNameLower.includes(columnLower) || 
          columnLower.includes(kpiNameLower)) {
        console.log(`Exact match found: ${columnName} -> ${kpi.name}`)
        return {
          kpi_id: kpi.id,
          confidence: 0.95
        }
      }
    }

    // Then try pattern-based matching
    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => columnLower.includes(keyword))) {
        const matchingKPIs = kpis.filter(kpi => 
          keywords.some(keyword => kpi.name.toLowerCase().includes(keyword)) ||
          kpi.category.toLowerCase().includes(category)
        )

        if (matchingKPIs.length > 0) {
          console.log(`Pattern match found: ${columnName} -> ${matchingKPIs[0].name} (category: ${category})`)
          return {
            kpi_id: matchingKPIs[0].id,
            confidence: 0.85
          }
        }
      }
    }

    return null
  }

  /**
   * Embedding-based mapping using vector similarity
   */
  private async embeddingBasedMapping(
    columnName: string, 
    sampleValues: string[], 
    kpis: KPI[]
  ): Promise<{ kpi_id: string; confidence: number } | null> {
    try {
      // Create embeddings for column name and sample values
      const columnText = `${columnName}: ${sampleValues.join(', ')}`
      const columnEmbedding = await openaiService.generateEmbedding(columnText)

      // Find most similar KPI using vector similarity
      const supabase = await createServiceClient()
      
      // First, ensure KPI embeddings exist
      await this.ensureKPIEmbeddings(kpis)

      // Search for similar embeddings
      const { data: similarEmbeddings, error } = await supabase.rpc('match_embeddings', {
        query_embedding: columnEmbedding,
        match_threshold: 0.5,
        match_count: 5
      })

      if (error || !similarEmbeddings || similarEmbeddings.length === 0) {
        return null
      }

      // Find the best matching KPI
      const bestMatch = similarEmbeddings[0]
      const kpiId = bestMatch.metadata?.kpi_id

      if (!kpiId) {
        return null
      }

      return {
        kpi_id: kpiId,
        confidence: bestMatch.similarity
      }
    } catch (error) {
      console.error('Error in embedding-based mapping:', error)
      return null
    }
  }

  /**
   * Ensure KPI embeddings exist in the database
   */
  private async ensureKPIEmbeddings(kpis: KPI[]): Promise<void> {
    const supabase = await createServiceClient()

    for (const kpi of kpis) {
      // Check if embedding already exists
      const { data: existing } = await supabase
        .from('embedding_vectors')
        .select('id')
        .eq('metadata->kpi_id', kpi.id)
        .single()

      if (existing) {
        continue
      }

      // Generate embedding for KPI
      const kpiText = `${kpi.name}: ${kpi.description} (${kpi.unit})`
      const embedding = await openaiService.generateEmbedding(kpiText)

      // Store embedding
      await supabase
        .from('embedding_vectors')
        .insert({
          content: kpiText,
          embedding: embedding,
          metadata: { kpi_id: kpi.id, type: 'kpi' }
        })
    }
  }

  /**
   * Parse string value to number
   */
  private parseNumericValue(value: any): number | null {
    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'string') {
      // Remove common non-numeric characters
      const cleaned = value.replace(/[,$%\s]/g, '')
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? null : parsed
    }

    return null
  }

  /**
   * Normalize value to standard unit
   */
  private async normalizeValue(value: number, targetUnit: string): Promise<{
    value: number
    unit: string
  }> {
    // For now, return as-is. In production, implement unit conversion logic
    // This could use the OpenAI service for complex unit conversions
    return { value, unit: targetUnit }
  }

  /**
   * Extract reporting period from row data
   */
  private extractPeriod(row: Record<string, any>): string {
    // Look for common period indicators
    const periodFields = ['year', 'period', 'date', 'reporting_period']
    
    for (const field of periodFields) {
      const value = row[field] || row[field.toUpperCase()] || row[field.toLowerCase()]
      if (value) {
        return value.toString()
      }
    }

    // Default to current year
    return new Date().getFullYear().toString()
  }

  /**
   * Validate data quality and generate quality score
   */
  async validateDataQuality(rawRecordId: string): Promise<{
    quality_score: number
    issues: string[]
    suggestions: string[]
  }> {
    const supabase = await createServiceClient()

    // Get raw record
    const { data: rawRecord } = await supabase
      .from('raw_records')
      .select('*')
      .eq('id', rawRecordId)
      .single()

    if (!rawRecord) {
      throw new Error('Raw record not found')
    }

    const rawData = rawRecord.raw_data as Record<string, any>[]
    
    // Use OpenAI to analyze data quality
    return await openaiService.analyzeDataQuality(rawData)
  }

  /**
   * Detect missing KPIs for a given period
   */
  async detectMissingKPIs(period: string): Promise<Array<{
    kpi_id: string
    kpi_name: string
    category: string
    urgency: 'low' | 'medium' | 'high'
    last_reported?: string
  }>> {
    const supabase = await createServiceClient()

    // Get all required KPIs
    const { data: requiredKPIs } = await supabase
      .from('kpis')
      .select('*')
      .eq('required', true)

    if (!requiredKPIs) {
      return []
    }

    // Get KPIs that have data for the period
    const { data: reportedKPIs } = await supabase
      .from('norm_records')
      .select('kpi_id')
      .eq('period', period)

    const reportedKPIIds = new Set(reportedKPIs?.map((r: any) => r.kpi_id) || [])

    // Get last reported dates for missing KPIs
    const missingKPIs = requiredKPIs.filter((kpi: KPI) => !reportedKPIIds.has(kpi.id))
    
    // For each missing KPI, find the last reported date (if any)
    const missingKPIsWithDates = await Promise.all(
      missingKPIs.map(async (kpi: KPI) => {
        const { data: lastReported } = await supabase
          .from('norm_records')
          .select('created_at')
          .eq('kpi_id', kpi.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          kpi_id: kpi.id,
          kpi_name: kpi.name,
          category: kpi.category,
          urgency: this.calculateUrgency(kpi.category),
          last_reported: lastReported?.created_at || undefined
        }
      })
    )

    return missingKPIsWithDates
  }

  /**
   * Get total number of required KPIs
   */
  async getTotalRequiredKPIs(): Promise<number> {
    const supabase = await createServiceClient()
    
    const { count } = await supabase
      .from('kpis')
      .select('*', { count: 'exact', head: true })
      .eq('required', true)

    return count || 0
  }

  /**
   * Calculate urgency level for missing KPI
   */
  private calculateUrgency(category: string): 'low' | 'medium' | 'high' {
    switch (category) {
      case 'environmental':
        return 'high' // Environmental data is often regulatory requirement
      case 'governance':
        return 'medium'
      case 'social':
        return 'low'
      default:
        return 'medium'
    }
  }

  /**
   * Batch process multiple raw records
   */
  async batchProcessRawRecords(rawRecordIds: string[]): Promise<{
    processed: number
    failed: number
    errors: string[]
  }> {
    let processed = 0
    let failed = 0
    const errors: string[] = []

    for (const recordId of rawRecordIds) {
      try {
        await this.processRawRecord(recordId)
        processed++
      } catch (error) {
        failed++
        errors.push(`${recordId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { processed, failed, errors }
  }
}

export const dataProcessor = DataProcessorService.getInstance() 