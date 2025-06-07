import { useState, useEffect } from 'react'
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

interface DataStats {
  overview: {
    totalDataSources: number
    processedRecords: number
    pendingRecords: number
    dataQualityScore: number
    newSourcesLastMonth: number
    recordsYesterday: number
  }
  quality: {
    completeness: number
    accuracy: number
    consistency: number
    timeliness: number
    overall: number
  }
  alerts: Array<{
    type: string
    title: string
    description: string
    severity: string
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

export function useRawRecords(search: string = '', source: string = 'all') {
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
      if (search) params.set('search', search)
      if (source !== 'all') params.set('source', source)

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
  }, [search, source])

  return { rawRecords, loading, error, refetch: fetchRawRecords }
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