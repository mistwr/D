import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(value: number | null | undefined, currency = 'EUR'): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '-'
  return `${value.toFixed(2)}%`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = parseISO(dateStr)
  if (!isValid(d)) return '-'
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDatetime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = parseISO(dateStr)
  if (!isValid(d)) return '-'
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = parseISO(dateStr)
  if (!isValid(d)) return '-'
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return phone
}

export function formatNIF(nif: string | null | undefined): string {
  if (!nif) return '-'
  const digits = nif.replace(/\D/g, '')
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return nif
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function fullName(profile: { first_name: string; last_name: string } | null | undefined): string {
  if (!profile) return '-'
  return `${profile.first_name} ${profile.last_name}`.trim() || '-'
}

export function truncate(str: string | null | undefined, length: number): string {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '…' : str
}
