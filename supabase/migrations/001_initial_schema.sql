-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create custom types
CREATE TYPE data_source_type AS ENUM ('csv', 'api', 'webhook');
CREATE TYPE kpi_category AS ENUM ('environmental', 'social', 'governance');
CREATE TYPE task_type AS ENUM ('approval', 'review', 'correction');
CREATE TYPE task_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE operation_type AS ENUM ('create', 'update', 'delete');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high');

-- Data Sources table
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type data_source_type NOT NULL,
    department VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPIs table
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    unit VARCHAR(50) NOT NULL,
    issb_tag VARCHAR(100),
    category kpi_category NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raw Records table
CREATE TABLE raw_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    file_uri TEXT,
    raw_data JSONB NOT NULL,
    original_filename VARCHAR(255),
    upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE
);

-- Mapping Rules table
CREATE TABLE mapping_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alias VARCHAR(255) NOT NULL,
    kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated BOOLEAN DEFAULT FALSE,
    UNIQUE(alias, kpi_id)
);

-- Normalized Records table
CREATE TABLE norm_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_record_id UUID NOT NULL REFERENCES raw_records(id) ON DELETE CASCADE,
    kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    period VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    audit_trail_id UUID
);

-- Audit Trail table (blockchain-style)
CREATE TABLE audit_trails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL,
    operation operation_type NOT NULL,
    actor_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hash VARCHAR(64) NOT NULL,
    prev_hash VARCHAR(64),
    data_snapshot JSONB NOT NULL
);

-- Workflow Tasks table
CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type task_type NOT NULL,
    status task_status DEFAULT 'pending',
    assignee_id UUID NOT NULL,
    record_id UUID NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Embedding Vectors table for AI similarity search
CREATE TABLE embedding_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-large dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_raw_records_data_source ON raw_records(data_source_id);
CREATE INDEX idx_raw_records_processed ON raw_records(processed);
CREATE INDEX idx_norm_records_kpi ON norm_records(kpi_id);
CREATE INDEX idx_norm_records_period ON norm_records(period);
CREATE INDEX idx_audit_trails_record ON audit_trails(record_id);
CREATE INDEX idx_audit_trails_timestamp ON audit_trails(timestamp);
CREATE INDEX idx_workflow_tasks_assignee ON workflow_tasks(assignee_id);
CREATE INDEX idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX idx_mapping_rules_alias ON mapping_rules(alias);

-- Create vector similarity search index
CREATE INDEX ON embedding_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE norm_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic examples - customize based on your auth requirements)
CREATE POLICY "Users can view their department's data sources" ON data_sources
    FOR SELECT USING (auth.jwt() ->> 'department' = department);

CREATE POLICY "Users can insert data to their department's sources" ON raw_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_sources 
            WHERE id = data_source_id 
            AND department = auth.jwt() ->> 'department'
        )
    );

-- Function to calculate similarity between embeddings
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        embedding_vectors.id,
        embedding_vectors.content,
        embedding_vectors.metadata,
        1 - (embedding_vectors.embedding <=> query_embedding) as similarity
    FROM embedding_vectors
    WHERE 1 - (embedding_vectors.embedding <=> query_embedding) > match_threshold
    ORDER BY embedding_vectors.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Function to create audit trail hash
CREATE OR REPLACE FUNCTION create_audit_hash(
    record_id UUID,
    operation operation_type,
    actor_id UUID,
    data_snapshot JSONB,
    prev_hash VARCHAR(64) DEFAULT NULL
)
RETURNS VARCHAR(64)
LANGUAGE plpgsql
AS $$
DECLARE
    hash_input TEXT;
    result_hash VARCHAR(64);
BEGIN
    hash_input := record_id::TEXT || operation::TEXT || actor_id::TEXT || 
                  data_snapshot::TEXT || COALESCE(prev_hash, '');
    
    -- Use SHA-256 hash
    result_hash := encode(digest(hash_input, 'sha256'), 'hex');
    
    RETURN result_hash;
END;
$$;

-- Trigger function to automatically create audit trail
CREATE OR REPLACE FUNCTION create_audit_trail()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    last_hash VARCHAR(64);
    new_hash VARCHAR(64);
    actor_id UUID;
BEGIN
    -- Get the last hash for this record
    SELECT hash INTO last_hash
    FROM audit_trails
    WHERE record_id = COALESCE(NEW.id, OLD.id)
    ORDER BY timestamp DESC
    LIMIT 1;
    
    -- Get actor from JWT or use system user
    actor_id := COALESCE((auth.jwt() ->> 'sub')::UUID, '00000000-0000-0000-0000-000000000000'::UUID);
    
    -- Create new hash
    new_hash := create_audit_hash(
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'::operation_type
            WHEN TG_OP = 'UPDATE' THEN 'update'::operation_type
            WHEN TG_OP = 'DELETE' THEN 'delete'::operation_type
        END,
        actor_id,
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END,
        last_hash
    );
    
    -- Insert audit trail
    INSERT INTO audit_trails (record_id, operation, actor_id, hash, prev_hash, data_snapshot)
    VALUES (
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'::operation_type
            WHEN TG_OP = 'UPDATE' THEN 'update'::operation_type
            WHEN TG_OP = 'DELETE' THEN 'delete'::operation_type
        END,
        actor_id,
        new_hash,
        last_hash,
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for audit trail
CREATE TRIGGER audit_norm_records
    AFTER INSERT OR UPDATE OR DELETE ON norm_records
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps
CREATE TRIGGER update_data_sources_updated_at 
    BEFORE UPDATE ON data_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample KPIs based on ISSB standards
INSERT INTO kpis (name, description, unit, issb_tag, category, required) VALUES
('Scope 1 GHG Emissions', 'Direct greenhouse gas emissions from owned or controlled sources', 'tCO2e', 'E1-1', 'environmental', true),
('Scope 2 GHG Emissions', 'Indirect greenhouse gas emissions from purchased energy', 'tCO2e', 'E1-2', 'environmental', true),
('Scope 3 GHG Emissions', 'All other indirect greenhouse gas emissions', 'tCO2e', 'E1-3', 'environmental', true),
('Water Consumption', 'Total water consumed by the organization', 'm3', 'E3-1', 'environmental', true),
('Waste Generated', 'Total waste generated by the organization', 'tonnes', 'E5-1', 'environmental', true),
('Employee Count', 'Total number of employees', 'count', 'S1-1', 'social', true),
('Employee Turnover Rate', 'Percentage of employees who left during the period', 'percentage', 'S1-2', 'social', false),
('Board Independence', 'Percentage of independent board members', 'percentage', 'G1-1', 'governance', true),
('Data Security Incidents', 'Number of data security incidents', 'count', 'G2-1', 'governance', true),
('Energy Consumption', 'Total energy consumed by the organization', 'MWh', 'E1-4', 'environmental', true);

COMMENT ON TABLE data_sources IS 'Sources of ESG data (departments, systems, etc.)';
COMMENT ON TABLE raw_records IS 'Raw uploaded data before processing';
COMMENT ON TABLE kpis IS 'Key Performance Indicators based on ISSB standards';
COMMENT ON TABLE mapping_rules IS 'AI-generated mappings between data columns and KPIs';
COMMENT ON TABLE norm_records IS 'Normalized and processed ESG data';
COMMENT ON TABLE audit_trails IS 'Blockchain-style audit trail for data integrity';
COMMENT ON TABLE workflow_tasks IS 'Tasks for data approval and review workflow';
COMMENT ON TABLE embedding_vectors IS 'Vector embeddings for AI-powered similarity search'; 