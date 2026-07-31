import type { Segment, UserRole, DealStage, TaskStatus, TaskPriority, CommissionStatus, DocumentStatus, LeadOrigin } from '@/lib/supabase/types'

export const SEGMENT_LABELS: Record<Segment, string> = {
  energia: 'Energia',
  telecom: 'Telecom',
  credito: 'Crédito',
  imobiliario: 'Imobiliário',
  seguros: 'Seguros',
}

export const SEGMENT_COLORS: Record<Segment, string> = {
  energia: '#F59E0B',
  telecom: '#3B82F6',
  credito: '#10B981',
  imobiliario: '#8B5CF6',
  seguros: '#EF4444',
}

export const SEGMENT_ICONS: Record<Segment, string> = {
  energia: 'Zap',
  telecom: 'Wifi',
  credito: 'CreditCard',
  imobiliario: 'Home',
  seguros: 'Shield',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  ceo: 'CEO',
  direcao: 'Direção',
  operadora: 'Operadora',
  especialista: 'Especialista',
  unidade: 'Unidade',
  franquia: 'Franquia',
  parceiro: 'Parceiro',
}

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  nova_lead: 'Nova Lead',
  contactar: 'Contactar',
  contactado: 'Contactado',
  documentacao_solicitada: 'Doc. Solicitada',
  documentacao_recebida: 'Doc. Recebida',
  em_analise: 'Em Análise',
  proposta: 'Proposta',
  aguardar_cliente: 'Aguardar Cliente',
  contrato_fechado: 'Contrato Fechado',
  aguardar_comissao: 'Aguardar Comissão',
  comissao_recebida: 'Comissão Recebida',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: 'Pendente',
  em_progresso: 'Em Progresso',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
}

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  prevista: 'Prevista',
  parceiro: 'Parceiro',
  recebida: 'Recebida',
  validada: 'Validada',
  paga: 'Paga',
  cancelada: 'Cancelada',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pendente: 'Pendente',
  recebido: 'Recebido',
  validado: 'Validado',
  rejeitado: 'Rejeitado',
  expirado: 'Expirado',
}

export const LEAD_ORIGIN_LABELS: Record<LeadOrigin, string> = {
  website: 'Website',
  csv: 'CSV',
  whatsapp: 'WhatsApp',
  google: 'Google',
  meta: 'Meta (Facebook)',
  telefone: 'Telefone',
  manual: 'Manual',
  parceiro: 'Parceiro',
  unidade: 'Unidade',
  cross_sell: 'Cross-sell',
}

export const ADMIN_ROLES: UserRole[] = ['superadmin', 'admin', 'ceo', 'direcao']

export const SEGMENTS: Segment[] = ['energia', 'telecom', 'credito', 'imobiliario', 'seguros']

export const PARCENDI_COMPANY = {
  name: 'PARCENDi',
  tagline: 'Consultoria Multisserviços',
  phone: '+351 253 000 000',
  email: 'geral@parcendi.pt',
  address: 'Barcelos, Portugal',
  nif: '999 999 999',
  website: 'https://parcendi.pt',
}
