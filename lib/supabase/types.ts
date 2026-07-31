export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      units: {
        Row: Unit
        Insert: Omit<Unit, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Unit, 'id' | 'created_at'>>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Lead, 'id' | 'created_at'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at'>>
      }
      deals: {
        Row: Deal
        Insert: Omit<Deal, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Deal, 'id' | 'created_at'>>
      }
      deal_history: {
        Row: DealHistory
        Insert: Omit<DealHistory, 'id' | 'created_at'>
        Update: Partial<Omit<DealHistory, 'id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id' | 'created_at'>>
      }
      commissions: {
        Row: Commission
        Insert: Omit<Commission, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Commission, 'id' | 'created_at'>>
      }
      commission_configs: {
        Row: CommissionConfig
        Insert: Omit<CommissionConfig, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CommissionConfig, 'id' | 'created_at'>>
      }
      cross_sells: {
        Row: CrossSell
        Insert: Omit<CrossSell, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CrossSell, 'id' | 'created_at'>>
      }
      renewals: {
        Row: Renewal
        Insert: Omit<Renewal, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Renewal, 'id' | 'created_at'>>
      }
      partners: {
        Row: Partner
        Insert: Omit<Partner, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Partner, 'id' | 'created_at'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
      }
      pipeline_stages: {
        Row: PipelineStage
        Insert: Omit<PipelineStage, 'id' | 'created_at'>
        Update: Partial<Omit<PipelineStage, 'id' | 'created_at'>>
      }
      contact_submissions: {
        Row: ContactSubmission
        Insert: Omit<ContactSubmission, 'id' | 'created_at'>
        Update: Partial<Omit<ContactSubmission, 'id'>>
      }
      whatsapp_messages: {
        Row: WhatsappMessage
        Insert: Omit<WhatsappMessage, 'id' | 'created_at'>
        Update: Partial<Omit<WhatsappMessage, 'id'>>
      }
    }
    Enums: {
      user_role: UserRole
      segment: Segment
      lead_origin: LeadOrigin
      deal_stage: DealStage
      commission_status: CommissionStatus
      document_status: DocumentStatus
      task_status: TaskStatus
      task_priority: TaskPriority
      notification_type: NotificationType
      cross_sell_status: CrossSellStatus
      renewal_status: RenewalStatus
      partner_type: PartnerType
      unit_type: UnitType
    }
  }
}

// ENUMS
export type UserRole = 'superadmin' | 'admin' | 'ceo' | 'direcao' | 'operadora' | 'especialista' | 'unidade' | 'franquia' | 'parceiro'
export type Segment = 'energia' | 'telecom' | 'credito' | 'imobiliario' | 'seguros'
export type LeadOrigin = 'website' | 'csv' | 'whatsapp' | 'google' | 'meta' | 'telefone' | 'manual' | 'parceiro' | 'unidade' | 'cross_sell'
export type DealStage = 'nova_lead' | 'contactar' | 'contactado' | 'documentacao_solicitada' | 'documentacao_recebida' | 'em_analise' | 'proposta' | 'aguardar_cliente' | 'contrato_fechado' | 'aguardar_comissao' | 'comissao_recebida' | 'fechado' | 'perdido'
export type CommissionStatus = 'prevista' | 'parceiro' | 'recebida' | 'validada' | 'paga' | 'cancelada'
export type DocumentStatus = 'pendente' | 'recebido' | 'validado' | 'rejeitado' | 'expirado'
export type TaskStatus = 'pendente' | 'em_progresso' | 'concluida' | 'cancelada'
export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente'
export type NotificationType = 'lead' | 'task' | 'deal' | 'commission' | 'renewal' | 'document' | 'system'
export type CrossSellStatus = 'aberto' | 'em_progresso' | 'convertido' | 'perdido'
export type RenewalStatus = 'ativo' | 'proximo' | 'em_renovacao' | 'renovado' | 'cancelado'
export type PartnerType = 'individual' | 'empresa' | 'franquia' | 'agente'
export type UnitType = 'sede' | 'franquia' | 'parceiro' | 'agencia'

// TABLE TYPES
export type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  unit_id: string | null
  is_active: boolean
  nif: string | null
  iban: string | null
  commission_rate: number | null
  created_at: string
  updated_at: string
}

export type Unit = {
  id: string
  name: string
  code: string
  type: UnitType
  address: string | null
  city: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  manager_id: string | null
  parent_unit_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PipelineStage = {
  id: string
  segment: Segment
  name: string
  position: number
  color: string
  is_won: boolean
  is_lost: boolean
  is_active: boolean
  created_at: string
}

export type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  nif: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  notes: string | null
  assigned_to: string | null
  unit_id: string | null
  is_active: boolean
  rgpd_consent: boolean
  rgpd_consent_date: string | null
  created_at: string
  updated_at: string
}

export type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  origin: LeadOrigin
  segment: Segment
  assigned_to: string | null
  unit_id: string | null
  client_id: string | null
  status: string
  score: number | null
  notes: string | null
  rgpd_consent: boolean
  rgpd_consent_date: string | null
  source_campaign: string | null
  source_medium: string | null
  converted: boolean | null
  converted_at: string | null
  created_at: string
  updated_at: string
}

export type Deal = {
  id: string
  title: string
  client_id: string | null
  lead_id: string | null
  segment: Segment
  stage: DealStage
  stage_id: string | null
  assigned_to: string | null
  unit_id: string | null
  value: number | null
  commission_value: number | null
  contract_start_date: string | null
  contract_end_date: string | null
  renewal_date: string | null
  notes: string | null
  closed_at: string | null
  lost_reason: string | null
  is_renewal: boolean | null
  parent_deal_id: string | null
  created_at: string
  updated_at: string
}

export type DealHistory = {
  id: string
  deal_id: string
  from_stage: DealStage | null
  to_stage: DealStage
  changed_by: string | null
  notes: string | null
  created_at: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  created_by: string | null
  deal_id: string | null
  lead_id: string | null
  client_id: string | null
  due_date: string | null
  completed_at: string | null
  is_automated: boolean | null
  created_at: string
  updated_at: string
}

export type Document = {
  id: string
  name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  status: DocumentStatus
  client_id: string | null
  deal_id: string | null
  lead_id: string | null
  uploaded_by: string | null
  validated_by: string | null
  validated_at: string | null
  expires_at: string | null
  notes: string | null
  rgpd_delete_at: string | null
  created_at: string
  updated_at: string
}

export type CommissionConfig = {
  id: string
  segment: Segment
  role: UserRole
  percentage: number
  franquia_percentage: number | null
  marketing_percentage: number | null
  impacto_social_percentage: number | null
  recrutamento_percentage: number | null
  is_active: boolean | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Commission = {
  id: string
  deal_id: string
  profile_id: string
  status: CommissionStatus
  gross_value: number
  net_value: number
  percentage: number
  origin: string | null
  executor_id: string | null
  franquia_value: number | null
  marketing_value: number | null
  impacto_social_value: number | null
  recrutamento_value: number | null
  validated_by: string | null
  validated_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type CrossSell = {
  id: string
  client_id: string
  origin_deal_id: string | null
  new_deal_id: string | null
  segment: Segment
  status: CrossSellStatus
  assigned_to: string | null
  created_by: string | null
  potential_value: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Renewal = {
  id: string
  deal_id: string
  client_id: string
  segment: Segment
  status: RenewalStatus
  contract_end_date: string
  renewal_date: string | null
  assigned_to: string | null
  unit_id: string | null
  notified_30d: boolean | null
  notified_60d: boolean | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Partner = {
  id: string
  name: string
  email: string | null
  phone: string | null
  type: PartnerType
  nif: string | null
  iban: string | null
  unit_id: string | null
  profile_id: string | null
  commission_rate: number | null
  is_active: boolean | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Notification = {
  id: string
  profile_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean | null
  link: string | null
  created_at: string
}

export type AuditLog = {
  id: string
  profile_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type ContactSubmission = {
  id: string
  name: string
  email: string
  phone: string | null
  segment: Segment | null
  message: string | null
  origin: LeadOrigin | null
  page: string | null
  rgpd_consent: boolean
  processed: boolean | null
  lead_id: string | null
  created_at: string
}

export type WhatsappMessage = {
  id: string
  client_id: string | null
  lead_id: string | null
  phone: string
  direction: 'inbound' | 'outbound'
  message: string
  template: string | null
  status: string | null
  sent_by: string | null
  created_at: string
}

// Extended types with joined data
export type ProfileWithUnit = Profile & { units?: Unit | null }
export type LeadWithProfile = Lead & { profiles?: Profile | null; units?: Unit | null }
export type DealWithClient = Deal & { clients?: Client | null; profiles?: Profile | null }
export type ClientWithProfile = Client & { profiles?: Profile | null }
export type CommissionWithDeal = Commission & { deals?: Deal | null; profiles?: Profile | null }
