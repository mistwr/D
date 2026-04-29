'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SetupPage() {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    runSetup()
  }, [])

  async function runSetup() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      console.log('[v0] Setup: Chamando API setup...')
      const res = await fetch('/api/setup', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      console.log('[v0] Setup: Resposta -', data)
      
      setResult(data)
      
      if (!data.success) {
        setError(data.message || 'Erro ao criar tabelas')
      }
    } catch (err: any) {
      console.error('[v0] Setup error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: '30px' }}>🔧 Setup do Supabase</h1>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            fontSize: '48px', 
            animation: 'spin 1s linear infinite',
            display: 'inline-block'
          }}>
            ⚙️
          </div>
          <p style={{ marginTop: '20px', fontSize: '18px' }}>Criando tabelas...</p>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #f99',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          color: '#900'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>❌ Erro</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
            Tente executar o SQL manualmente em {' '}
            <a href="https://app.supabase.com" target="_blank" style={{ color: '#900', textDecoration: 'underline' }}>
              Supabase Console
            </a>
          </p>
        </div>
      )}

      {result?.success && (
        <div style={{
          background: '#efe',
          border: '1px solid #9f9',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#060' }}>✅ Sucesso!</h3>
          <p style={{ margin: '10px 0', color: '#060' }}>
            {result.message}
          </p>
          {result.credentials && (
            <div style={{ 
              background: '#fff', 
              padding: '15px', 
              borderRadius: '4px',
              marginTop: '10px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              <p style={{ margin: '5px 0' }}>📧 Email: <strong>{result.credentials.email}</strong></p>
              <p style={{ margin: '5px 0' }}>🔐 Senha: <strong>{result.credentials.password}</strong></p>
              <p style={{ margin: '5px 0' }}>👤 Role: <strong>{result.credentials.role}</strong></p>
            </div>
          )}
        </div>
      )}

      {!loading && result?.success && (
        <div style={{ marginTop: '30px' }}>
          <h2>Próximos Passos</h2>
          <ol style={{ fontSize: '16px', lineHeight: '1.8' }}>
            <li>
              Ir para <Link href="/login" style={{ color: '#4f46e5', textDecoration: 'underline' }}>
                /login
              </Link>
            </li>
            <li>
              Fazer login com as credenciais acima (email: admin@test.com)
            </li>
            <li>
              Ou registar uma nova conta em{' '}
              <Link href="/register" style={{ color: '#4f46e5', textDecoration: 'underline' }}>
                /register
              </Link>
            </li>
            <li>
              Criar contratos em{' '}
              <Link href="/contratos" style={{ color: '#4f46e5', textDecoration: 'underline' }}>
                /contratos
              </Link>
            </li>
          </ol>

          <div style={{ marginTop: '30px' }}>
            <Link href="/login" style={{
              display: 'inline-block',
              background: '#4f46e5',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              → Ir para Login
            </Link>
          </div>
        </div>
      )}

      {!loading && !result?.success && !error && (
        <button 
          onClick={runSetup}
          style={{
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Executar Setup
        </button>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      <details style={{ marginTop: '30px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          📋 Ver SQL que foi executado
        </summary>
        <pre style={{
          background: '#f5f5f5',
          padding: '15px',
          borderRadius: '6px',
          overflow: 'auto',
          fontSize: '12px',
          marginTop: '15px',
          lineHeight: '1.4'
        }}>{`-- Tabela Users
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'parceiro',
  company_name VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela Contratos
DROP TABLE IF EXISTS public.contratos CASCADE;
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_cc VARCHAR(20),
  client_nif VARCHAR(20),
  client_morada TEXT,
  client_email VARCHAR(255),
  servico_type VARCHAR(50) NOT NULL,
  operadora VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'rascunho',
  assinado_cliente BOOLEAN DEFAULT false,
  assinado_vendedor BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela Assinaturas
DROP TABLE IF EXISTS public.contrato_assinaturas CASCADE;
CREATE TABLE IF NOT EXISTS public.contrato_assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  assinante_id UUID NOT NULL REFERENCES public.users(id),
  assinante_email VARCHAR(255),
  assinante_nome VARCHAR(255),
  tipo VARCHAR(50) NOT NULL,
  signature_image_base64 TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}</pre>
      </details>
    </div>
  )
}

