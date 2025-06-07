export interface AuditTrail {
  id: string
  record_id: string
  operation: 'create' | 'update' | 'delete'
  actor_id: string
  timestamp: string
  hash: string
  prev_hash: string | null
  data_snapshot: any
  // Join fields
  actor_name?: string
  record_type?: string
  description?: string
  verified?: boolean
}

export interface WorkflowTask {
  id: string
  type: 'approval' | 'review' | 'correction'
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  assignee_id: string
  record_id: string
  description: string | null
  created_at: string
  completed_at: string | null
  // Join fields
  assignee_name?: string
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
}

export interface ComplianceCheck {
  category: string
  status: 'compliant' | 'partial' | 'non_compliant' | 'review'
  score: number
  lastCheck: string
  requirements?: string[]
  issues?: string[]
}

export interface AuditStats {
  total_records: number
  verified_records: number
  pending_tasks: number
  compliance_score: number
  high_priority_tasks: number
}

export interface BlockchainInfo {
  chainLength: number
  lastVerified: string
  integrity: number
  blocks: BlockchainBlock[]
}

export interface BlockchainBlock {
  id: string
  hash: string
  prevHash: string
  timestamp: string
  actor: string
  description: string
  verified: boolean
} 