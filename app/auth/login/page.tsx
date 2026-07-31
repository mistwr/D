import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Entrar — PARCENDi CRM' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#0057FF 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              PARCEN<span className="text-blue-400">Di</span>
            </span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold mb-4 text-balance">
            O seu CRM multisserviços tudo-em-um
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Gerencie leads, negócios, comissões, tarefas e documentos numa plataforma unificada
            e escalável para toda a equipa PARCENDi.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { value: '5 Segmentos', label: 'Energia, Telecom, Crédito, Imobiliário e Seguros' },
              { value: 'Pipeline Kanban', label: 'Gestão visual do funil de vendas por segmento' },
              { value: 'Comissões', label: 'Cálculo automático multi-nível' },
              { value: 'RGPD', label: 'Tratamento de dados em conformidade' },
            ].map((item) => (
              <div key={item.value} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="font-semibold text-sm text-blue-300">{item.value}</p>
                <p className="text-xs text-slate-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} PARCENDi. Todos os direitos reservados.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-xl tracking-tight">
                PARCEN<span className="text-brand">Di</span>
              </span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold mb-1">Bem-vindo de volta</h1>
          <p className="text-muted-foreground text-sm mb-8">Entre na sua conta CRM PARCENDi</p>
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem conta?{' '}
            <Link href="/auth/signup" className="text-brand hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
