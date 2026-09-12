import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CRMSidebar } from '@/components/crm/sidebar'

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-dvh bg-secondary md:h-screen md:overflow-hidden">
      <CRMSidebar profile={profile} />
      <main className="min-w-0 flex-1 pt-14 md:overflow-y-auto md:pt-0">
        {children}
      </main>
    </div>
  )
}
