import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DataSource {
  id: string
  name: string
  type: 'csv' | 'api' | 'webhook'
  department: string
  records: number
  lastUpdate: string
}

interface RawRecord {
  id: string
  filename: string
  source: string
  records: number
  status: 'pending' | 'processing' | 'processed' | 'error'
  uploadTime: string
}

interface KPIMapping {
  id: string
  column: string
  kpi: string
  confidence: number
  status: 'pending' | 'validated'
  unit: string
  category: string
}

interface AutoMapping {
  column: string
  kpi_id: string
  kpi_name: string
  confidence: number
  unit: string
  category: string
  sample_values: string[]
  auto_approve: boolean
}

interface DataStats {
  overview: {
    totalDataSources: number
    processedRecords: number
    dataQualityScore: number
    pendingRecords: number
    newSourcesLastMonth: number
    recordsYesterday: number
  }
  quality: {
    completeness: number
    accuracy: number
    consistency: number
    timeliness: number
  }
  alerts: Array<{
    type: 'error' | 'warning' | 'info'
    title: string
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
}

export function useDataSources() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDataSources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/data/sources', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data sources')
      }

      const data = await response.json()
      setDataSources(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDataSources()
  }, [])

  return { dataSources, loading, error, refetch: fetchDataSources }
}

export function useRawRecords(searchTerm?: string, selectedSource?: string) {
  const [rawRecords, setRawRecords] = useState<RawRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRawRecords = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedSource && selectedSource !== 'all') params.append('source', selectedSource)

      const response = await fetch(`/api/data/records?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch raw records')
      }

      const data = await response.json()
      setRawRecords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRawRecords()
  }, [searchTerm, selectedSource])

  return { rawRecords, loading, error, refetch: fetchRawRecords }
}

export function useRawRecordDetail(id?: string) {
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecord = useCallback(async (recordId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch(`/api/data/records/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch raw record')
      }

      const data = await response.json()
      setRecord(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (id) {
      fetchRecord(id)
    }
  }, [id, fetchRecord])

  return { record, loading, error, refetch: fetchRecord }
}

export function useKPIMappings() {
  const [mappings, setMappings] = useState<KPIMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMappings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/data/mappings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch KPI mappings')
      }

      const data = await response.json()
      setMappings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const updateMapping = async (id: string, validated: boolean) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/data/mappings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id, validated })
      })

      if (!response.ok) {
        throw new Error('Failed to update mapping')
      }

      // Refresh data
      await fetchMappings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    fetchMappings()
  }, [])

  return { mappings, loading, error, refetch: fetchMappings, updateMapping }
}

export function useAutoMapping() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateAutoMappings = useCallback(async (rawData?: Record<string, any>[], rawRecordId?: string): Promise<AutoMapping[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      const requestBody: any = {
        action: 'auto_map'
      }

      if (rawRecordId) {
        requestBody.raw_record_id = rawRecordId
      } else if (rawData) {
        requestBody.raw_data = rawData
      } else {
        throw new Error('Either rawData or rawRecordId must be provided')
      }

      const response = await fetch('/api/data/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Failed to generate auto mappings')
      }

      const data = await response.json()
      return data.mappings || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const approveMappings = useCallback(async (mappings: AutoMapping[]): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/data/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'batch_approve',
          columns: mappings
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve mappings')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { 
    generateAutoMappings, 
    approveMappings, 
    loading, 
    error, 
    clearError 
  }
}

export function useDataStats() {
  const [stats, setStats] = useState<DataStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/data/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, loading, error, refetch: fetchStats }
} 