import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = { title: 'Criar conta — PARCENDi CRM' }

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-16 bg-secondary">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl tracking-tight">
              PARCEN<span className="text-brand">Di</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-1">Criar conta</h1>
          <p className="text-muted-foreground text-sm">Registe-se para aceder ao CRM PARCENDi</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <SignupForm />
          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-brand hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
