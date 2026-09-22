'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, FileText, Users, Zap, Smartphone, Brain, Shield } from 'lucide-react'
import { LuminBrand } from '@/components/lumin-brand'

export default function SobrePage() {
  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Navbar */}
      <nav className="border-b" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <LuminBrand compact />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg" style={{ color: '#9a6b1a', background: '#fffaf0' }}>
              Entrar
            </Link>
            <Link href="/register" className="text-sm font-medium px-4 py-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #f1cf76 0%, #d6a84b 100%)', color: '#17130b' }}>
              Registar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="mb-8 flex justify-center">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-medium" style={{ background: '#fff7e6', color: '#9a6b1a' }}>
            Transformando a gestão de vendas
          </span>
        </div>
        <h2 className="text-5xl md:text-6xl font-bold mb-6 text-balance" style={{ color: '#1e293b' }}>
          CRM Inteligente para Parceiros de Energia e Telecom
        </h2>
        <p className="text-xl mb-8 text-balance" style={{ color: '#64748b', maxWidth: '700px', margin: '0 auto' }}>
          Plataforma completa para registar vendas, gerenciar documentos, simular comissões e acompanhar campanhas em tempo real. Potenciado pela Lumin AI para automação, análise e evolução contínua.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register" className="px-8 py-3 rounded-lg font-semibold flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #f1cf76 0%, #d6a84b 100%)', color: '#17130b' }}>
            Começar Agora <ArrowRight size={18} />
          </Link>
          <Link href="#features" className="px-8 py-3 rounded-lg font-semibold" style={{ background: '#f8fafc', color: '#1e293b' }}>
            Saber Mais
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t" style={{ borderColor: '#e5e7eb' }}>
        <h3 className="text-3xl font-bold text-center mb-16" style={{ color: '#1e293b' }}>Funcionalidades Principais</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <BarChart3 size={24} />, title: 'Dashboard Inteligente', desc: 'Visualize metrics em tempo real: vendas, comissões, clientes ativos' },
            { icon: <FileText size={24} />, title: 'Gestão de Documentos', desc: 'Upload de contratos, faturas e PDFs associados a cada venda' },
            { icon: <Zap size={24} />, title: 'Simulador de Comissões', desc: 'Calcule estimativas de ganhos por venda - energia e telecom separadas' },
            { icon: <Users size={24} />, title: 'Admin Avançado', desc: 'Gestão de parceiros, campanhas, importação em massa de dados' },
            { icon: <Smartphone size={24} />, title: 'Compartilhamento WhatsApp', desc: 'Envie campanhas e publicações direto para WhatsApp' },
            { icon: <Brain size={24} />, title: 'Sistema IA-Ready', desc: 'Arquitetura preparada para análises e sugestões inteligentes' },
            { icon: <Shield size={24} />, title: 'Segurança Total', desc: 'Autenticação RLS no Supabase, dados criptografados' },
            { icon: <BarChart3 size={24} />, title: 'Relatórios & Exportação', desc: 'Gere relatórios detalhados, exporte dados em CSV/Excel' },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-lg border" style={{ borderColor: '#e5e7eb', background: '#fafbfc' }}>
              <div className="mb-4 p-3 rounded-lg w-fit" style={{ background: '#fff7e6', color: '#9a6b1a' }}>
                {f.icon}
              </div>
              <h4 className="font-semibold mb-2" style={{ color: '#1e293b' }}>{f.title}</h4>
              <p className="text-sm" style={{ color: '#64748b' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como Funciona */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t" style={{ borderColor: '#e5e7eb' }}>
        <h3 className="text-3xl font-bold text-center mb-16" style={{ color: '#1e293b' }}>Como Funciona</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { num: '1', title: 'Parceiros Registam Vendas', desc: 'Cria nova venda com cliente, servico (energia/telecom), operadora e valor. Faz upload de documentos e contratos.' },
            { num: '2', title: 'Admin Valida & Publica', desc: 'Admin revê vendas, define comissões por parceiro, e cria campanhas com PDFs e materiais de venda.' },
            { num: '3', title: 'Compartilhar & Ganhar', desc: 'Parceiros veem simulador de comissões, compartilham campanhas por WhatsApp, e acompanham ganhos em tempo real.' },
          ].map((s, i) => (
            <div key={i} className="p-8 rounded-lg border-2" style={{ borderColor: '#e5e7eb', background: 'white' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 font-bold text-lg" style={{ background: 'linear-gradient(135deg, #f1cf76 0%, #d6a84b 100%)', color: '#17130b' }}>
                {s.num}
              </div>
              <h4 className="font-semibold mb-3 text-lg" style={{ color: '#1e293b' }}>{s.title}</h4>
              <p style={{ color: '#64748b' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Servicos */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t" style={{ borderColor: '#e5e7eb' }}>
        <h3 className="text-3xl font-bold text-center mb-16" style={{ color: '#1e293b' }}>Servicos Suportados</h3>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="p-8 rounded-lg" style={{ background: '#fef3c7', borderColor: '#fcd34d', borderWidth: '2px' }}>
            <h4 className="text-2xl font-bold mb-4" style={{ color: '#92400e' }}>⚡ Energia</h4>
            <div className="space-y-2">
              {['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy'].map(op => (
                <div key={op} className="flex items-center gap-2" style={{ color: '#78350f' }}>
                  <span>✓</span> {op}
                </div>
              ))}
            </div>
          </div>
          <div className="p-8 rounded-lg" style={{ background: '#e0e7ff', borderColor: '#a5b4fc', borderWidth: '2px' }}>
            <h4 className="text-2xl font-bold mb-4" style={{ color: '#0ea5e9' }}>📱 Telecomunicações</h4>
            <div className="space-y-2">
              {['MEO', 'NOS', 'Vodafone', 'NOWO'].map(op => (
                <div key={op} className="flex items-center gap-2" style={{ color: '#312e81' }}>
                  <span>✓</span> {op}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stack Tecnológico */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t" style={{ borderColor: '#e5e7eb' }}>
        <h3 className="text-3xl font-bold text-center mb-16" style={{ color: '#1e293b' }}>Stack Tecnológico</h3>
        <div className="grid md:grid-cols-5 gap-6 text-center">
          {[
            { name: 'Next.js 16', icon: '⚙️' },
            { name: 'React 19', icon: '⚛️' },
            { name: 'TypeScript', icon: '🔷' },
            { name: 'TailwindCSS', icon: '🎨' },
            { name: 'Supabase', icon: '🗄️' },
          ].map((tech, i) => (
            <div key={i} className="p-6 rounded-lg" style={{ background: '#f9fafb' }}>
              <div className="text-4xl mb-3">{tech.icon}</div>
              <p className="font-semibold" style={{ color: '#1e293b' }}>{tech.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t" style={{ borderColor: '#e5e7eb' }}>
        <div className="rounded-lg p-12 text-center" style={{ background: '#fff7e6' }}>
          <h3 className="text-3xl font-bold mb-4" style={{ color: '#7a5a18' }}>Pronto para Aumentar as suas Vendas?</h3>
          <p className="text-lg mb-8" style={{ color: '#7a6b52' }}>Tecnologia Lumin AI ao serviço da operação comercial da Soluções Diferentes.</p>
          <Link href="/register" className="inline-block px-8 py-4 rounded-lg font-semibold" style={{ background: 'linear-gradient(135deg, #f1cf76 0%, #d6a84b 100%)', color: '#17130b' }}>
            Começar Agora - É Grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p style={{ color: '#64748b' }}>&copy; 2026 Soluções Diferentes · Tecnologia Lumin AI.</p>
        </div>
      </footer>
    </div>
  )
}
