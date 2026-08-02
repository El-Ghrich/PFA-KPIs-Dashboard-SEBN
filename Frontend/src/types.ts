export interface Project {
  id: string
  name: string
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'
  location: string | null
  created_at: string
}

export interface KPIDefinition {
  id: string
  name: string
  unit: string
  kpi_type: 'NUMERIC' | 'TEXT'
}

export interface KPIRecord {
  id: string
  project_id: string
  kpi_id: string
  record_date: string
  period: 'DAILY' | 'WEEKLY'
  numeric_value: number | null
  is_missing: boolean
  created_at: string
  created_by: string | null
  kpi_definition: KPIDefinition | null
}

export interface Highlight {
  id: string
  project_id: string
  record_date: string
  period: 'DAILY' | 'WEEKLY'
  value: string
  status: 'GOOD' | 'BAD'
  created_at: string
  created_by: string | null
  api_key_id: string | null
}

export interface User {
  id: string
  email: string
  full_name: string
  role: 'ADMIN' | 'VIEWER'
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  refresh_token: string
  user: User
}
