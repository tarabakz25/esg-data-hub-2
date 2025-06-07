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
      // Enhanced AI mapping with multiple strategies
      const strategies = [
        () => this.semanticSimilarityMapping(columnName, sampleValues, kpis),
        () => this.ruleBasedMapping(columnName, sampleValues, kpis),
        () => this.embeddingBasedMapping(columnName, sampleValues, kpis)
      ]

      const results = []

      // Try multiple mapping strategies
      for (const strategy of strategies) {
        try {
          const result = await strategy()
          if (result) {
            results.push(result)
          }
        } catch (error) {
          console.error('Strategy failed:', error)
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
      const request = {
        column_name: columnName,
        sample_values: sampleValues,
        context: `Available KPIs: ${kpis.map(k => `${k.name} (${k.category})`).join(', ')}`
      }

      const response = await openaiService.mapColumnToKPI(request)
      
      // Find the KPI by name or description match
      if (!response.kpi_id || typeof response.kpi_id !== 'string') {
        console.error('Invalid AI response - kpi_id is null or not a string:', response)
        return null
      }

      const matchedKPI = kpis.find(kpi => 
        kpi.name.toLowerCase().includes(response.kpi_id.toLowerCase()) ||
        response.kpi_id.toLowerCase().includes(kpi.name.toLowerCase()) ||
        kpi.description?.toLowerCase().includes(response.kpi_id.toLowerCase())
      )

      if (matchedKPI) {
        return {
          kpi_id: matchedKPI.id,
          confidence: response.confidence
        }
      }

      return null
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
      co2: ['co2', 'carbon', 'emission', 'ghg', 'greenhouse'],
      energy: ['energy', 'electricity', 'power', 'kwh', 'consumption'],
      water: ['water', 'h2o', 'consumption', 'usage'],
      waste: ['waste', 'garbage', 'trash', 'disposal'],
      employee: ['employee', 'staff', 'worker', 'personnel', 'headcount'],
      revenue: ['revenue', 'sales', 'income', 'earnings'],
      diversity: ['diversity', 'gender', 'minority', 'inclusion'],
      safety: ['safety', 'accident', 'incident', 'injury']
    }

    const columnLower = columnName.toLowerCase()
    
    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => columnLower.includes(keyword))) {
        const matchingKPIs = kpis.filter(kpi => 
          kpi.category.toLowerCase().includes(category) ||
          kpi.name.toLowerCase().includes(category) ||
          keywords.some(keyword => kpi.name.toLowerCase().includes(keyword))
        )

        if (matchingKPIs.length > 0) {
          // Return the first matching KPI with high confidence
          return {
            kpi_id: matchingKPIs[0].id,
            confidence: 0.8
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

    // Find missing KPIs
    const missingKPIs = requiredKPIs.filter((kpi: KPI) => !reportedKPIIds.has(kpi.id))

    return missingKPIs.map((kpi: KPI) => ({
      kpi_id: kpi.id,
      kpi_name: kpi.name,
      category: kpi.category,
      urgency: this.calculateUrgency(kpi.category)
    }))
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