// ESG Data Hub Type Definitions

export interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'api' | 'webhook';
  department: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

export interface RawRecord {
  id: string;
  data_source_id: string;
  file_uri?: string;
  raw_data: Record<string, any>;
  original_filename?: string;
  upload_timestamp: string;
  processed: boolean;
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  unit: string;
  issb_tag?: string;
  category: 'environmental' | 'social' | 'governance';
  required: boolean;
  created_at: string;
}

export interface MappingRule {
  id: string;
  alias: string;
  kpi_id: string;
  confidence: number;
  created_at: string;
  validated: boolean;
}

export interface NormRecord {
  id: string;
  raw_record_id: string;
  kpi_id: string;
  value: number;
  unit: string;
  period: string;
  created_at: string;
  audit_trail_id?: string;
}

export interface AuditTrail {
  id: string;
  record_id: string;
  operation: 'create' | 'update' | 'delete';
  actor_id: string;
  timestamp: string;
  hash: string;
  prev_hash?: string;
  data_snapshot: Record<string, any>;
}

export interface WorkflowTask {
  id: string;
  type: 'approval' | 'review' | 'correction';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  assignee_id: string;
  record_id: string;
  description: string;
  created_at: string;
  completed_at?: string;
}

export interface EmbeddingVector {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  created_at: string;
}

// API Request/Response Types
export interface UploadFileRequest {
  file: File;
  data_source_id: string;
  metadata?: Record<string, any>;
}

export interface ProcessDataRequest {
  raw_record_id: string;
  force_reprocess?: boolean;
}

export interface MappingRequest {
  column_name: string;
  sample_values: string[];
  context?: string;
}

export interface MappingResponse {
  kpi_id: string;
  confidence: number;
  reasoning: string;
  suggested_unit?: string;
}

export interface MissingKPIAlert {
  kpi_id: string;
  kpi_name: string;
  category: string;
  last_reported?: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface DashboardData {
  total_records: number;
  processed_records: number;
  missing_kpis: number;
  data_quality_score: number;
  recent_uploads: RawRecord[];
  pending_tasks: WorkflowTask[];
}

// OpenAI Integration Types
export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      data_sources: {
        Row: DataSource;
        Insert: Omit<DataSource, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DataSource, 'id'>>;
      };
      raw_records: {
        Row: RawRecord;
        Insert: Omit<RawRecord, 'id' | 'upload_timestamp'>;
        Update: Partial<Omit<RawRecord, 'id'>>;
      };
      kpis: {
        Row: KPI;
        Insert: Omit<KPI, 'id' | 'created_at'>;
        Update: Partial<Omit<KPI, 'id'>>;
      };
      mapping_rules: {
        Row: MappingRule;
        Insert: Omit<MappingRule, 'id' | 'created_at'>;
        Update: Partial<Omit<MappingRule, 'id'>>;
      };
      norm_records: {
        Row: NormRecord;
        Insert: Omit<NormRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<NormRecord, 'id'>>;
      };
      audit_trails: {
        Row: AuditTrail;
        Insert: Omit<AuditTrail, 'id'>;
        Update: never;
      };
      workflow_tasks: {
        Row: WorkflowTask;
        Insert: Omit<WorkflowTask, 'id' | 'created_at'>;
        Update: Partial<Omit<WorkflowTask, 'id' | 'created_at'>>;
      };
      embedding_vectors: {
        Row: EmbeddingVector;
        Insert: Omit<EmbeddingVector, 'id' | 'created_at'>;
        Update: Partial<Omit<EmbeddingVector, 'id'>>;
      };
    };
  };
}

// Error Types
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Configuration Types
export interface AppConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  slack: {
    botToken: string;
    channelId: string;
  };
} 