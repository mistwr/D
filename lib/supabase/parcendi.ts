// PARCENDi production datastore lives inside the shared Indigo Supabase project.
// These are public client credentials (publishable/anon), safe to ship to the browser.
export const PARCENDI_SUPABASE_URL = 'https://yqninaripblwhcfcwwnr.supabase.co'
export const PARCENDI_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zlhSNpfeS3gjBDPsxOPiCQ_DYkKwgb_'

const TABLE_MAP: Record<string, string> = {
  profiles: 'parcendi_profiles',
  roles: 'parcendi_roles',
  permissions: 'parcendi_permissions',
  role_permissions: 'parcendi_role_permissions',
  units: 'parcendi_units',
  pipeline_stages: 'parcendi_pipeline_stages',
  clients: 'parcendi_clients',
  leads: 'parcendi_leads',
  deals: 'parcendi_deals',
  deal_history: 'parcendi_deal_history',
  tasks: 'parcendi_tasks',
  documents: 'parcendi_documents',
  commission_configs: 'parcendi_commission_configs',
  commission_rules: 'parcendi_commission_rules',
  commissions: 'parcendi_commissions',
  cross_sells: 'parcendi_cross_sells',
  renewals: 'parcendi_renewals',
  partners: 'parcendi_partners',
  notifications: 'parcendi_notifications',
  audit_logs: 'parcendi_audit_logs',
  contact_submissions: 'parcendi_contact_submissions',
  whatsapp_messages: 'parcendi_whatsapp_messages',
  energy_tariffs: 'parcendi_energy_tariffs',
  site_settings: 'parcendi_site_settings',
  site_campaigns: 'parcendi_site_campaigns',
}

/**
 * The Indigo project also hosts SD Dialer tables with generic names such as
 * `leads`. The PARCENDi app historically used those generic names too.
 * This proxy keeps the existing CRM code intact while safely routing only the
 * PARCENDi domain tables to their `parcendi_*` equivalents.
 */
export function withParcendiTables<T extends object>(client: T): T {
  return new Proxy(client as any, {
    get(target, prop, receiver) {
      if (prop === 'from') {
        return (table: string) => target.from(TABLE_MAP[table] ?? table)
      }
      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
  }) as T
}
