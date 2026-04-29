'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const OPERADORAS_ENERGIA = ['EDP', 'Endesa', 'Portologos', 'Repsol', 'Iberdrola']
const OPERADORAS_TELECOM = ['MEO', 'NOS', 'Vodafone', 'DIGI']

export default function NovoContratoPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_cc: '',
    client_nif: '',
    client_morada: '',
    client_email: '',
    servico_type: 'telecom',
    operadora: 'MEO',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json())
        if (!me.user) window.location.href = '/login'
        setUser(me.user)
      } catch (e) {
        console.error('[v0] Error:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/contratos/${data.contrato.id}`)
      } else {
        alert('Erro ao criar contrato: ' + data.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div>A carregar...</div>

  const operadoras = form.servico_type === 'energia' ? OPERADORAS_ENERGIA : OPERADORAS_TELECOM

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/contratos" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#4338ca', textDecoration: 'none', marginBottom: '20px', fontSize: '14px' }}>
        <ArrowLeft size={16} /> Voltar
      </Link>

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '30px' }}>Novo Contrato</h1>

      <form onSubmit={handleSubmit} style={{ background: '#f9fafb', padding: '24px', borderRadius: '8px' }}>
        {/* Serviço */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Tipo de Serviço</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                Serviço
              </label>
              <select value={form.servico_type} onChange={(e) => {
                const type = e.target.value
                setForm({ ...form, servico_type: type, operadora: type === 'energia' ? OPERADORAS_ENERGIA[0] : OPERADORAS_TELECOM[0] })
              }} style={inputStyle}>
                <option value="telecom">Telecomunicações</option>
                <option value="energia">Energia</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                Operadora
              </label>
              <select value={form.operadora} onChange={(e) => setForm({ ...form, operadora: e.target.value })} style={inputStyle}>
                {operadoras.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Dados do Cliente</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Nome *</label>
              <input type="text" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required style={inputStyle} placeholder="Nome completo" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Contacto *</label>
              <input type="tel" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} required style={inputStyle} placeholder="Telefone ou email" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>CC *</label>
              <input type="text" value={form.client_cc} onChange={(e) => setForm({ ...form, client_cc: e.target.value })} required style={inputStyle} placeholder="Número CC" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>NIF *</label>
              <input type="text" value={form.client_nif} onChange={(e) => setForm({ ...form, client_nif: e.target.value })} required style={inputStyle} placeholder="NIF" />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Morada *</label>
            <input type="text" value={form.client_morada} onChange={(e) => setForm({ ...form, client_morada: e.target.value })} required style={inputStyle} placeholder="Morada" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Email (opcional)</label>
            <input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} style={inputStyle} placeholder="Email" />
          </div>
        </div>

        <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px', background: '#4338ca', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          {submitting ? 'A criar...' : 'Criar Contrato'}
        </button>
      </form>
    </div>
  )
}
