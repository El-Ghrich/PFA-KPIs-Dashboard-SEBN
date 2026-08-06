export interface ProjectSet {
  id: string
  project_id: string
  name: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'
  location: string | null
  created_at: string
  sets: ProjectSet[]
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
  role: 'SUPER_ADMIN' | 'ADMIN'
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  refresh_token: string
  user: User
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface ApiKey {
  id: string
  name: string
  description: string | null
  key_prefix: string
  user_id: string
  status: 'ACTIVE' | 'REVOKED' | 'DELETED'
  expires_at: string
  last_used_at: string | null
  created_at: string
}

export interface ApiKeyCreated extends ApiKey {
  plain_key: string
}

export interface ApiKeyCreateInput {
  name: string
  description?: string | null
  expires_at: string
  user_id?: string | null
}

export interface FilterState {
  location: string
  projectId: string
  year: number
  week: number
  compareWeek: number | null
  setId: string
}
