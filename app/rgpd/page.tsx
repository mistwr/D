'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Cookie, FileText, Mail, Eye, Trash2, Lock, UserCheck } from 'lucide-react'

const EMPRESA = 'Soluções Diferentes'
const EMAIL_DPO = 'privacidade@solucoesdiferentes.pt'
const MORADA = 'Portugal'
const DATA_ACTUALIZACAO = '2 de maio de 2025'

function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
      <div className="flex items-center gap-3 px-6 py-4" style={{ background: '#f9fafb', borderBottom: '1px solid #e2e8f0' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#eef2ff' }}>
          {icon}
        </div>
        <h2 className="text-base font-semibold" style={{ color: '#1e293b' }}>{title}</h2>
      </div>
      <div className="px-6 py-5 prose-sm space-y-3 text-sm leading-relaxed" style={{ color: '#475569' }}>
        {children}
      </div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed" style={{ color: '#475569' }}>{children}</p>
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }} />
      <span>{children}</span>
    </li>
  )
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-1.5">{children}</ul>
}

export default function RgpdPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/login"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:opacity-70"
            style={{ color: '#475569', background: '#f9fafb', border: '1px solid #e2e8f0' }}>
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: '#1e293b' }}>Politica de Privacidade e Cookies</h1>
            <p className="text-xs" style={{ color: '#9ca3af' }}>Ultima actualizacao: {DATA_ACTUALIZACAO}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Intro */}
        <div className="rounded-2xl p-6" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
              <Shield size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 className="font-semibold text-base" style={{ color: '#1e1b4b' }}>O seu direito a privacidade e a nossa prioridade</h2>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: '#3730a3' }}>
                A <strong>{EMPRESA}</strong> esta comprometida com a proteccao dos seus dados pessoais em conformidade com o
                Regulamento Geral sobre a Proteccao de Dados (RGPD — Regulamento UE 2016/679) e a legislacao portuguesa aplicavel.
                Este documento explica como recolhemos, utilizamos, armazenamos e protegemos os seus dados.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Responsavel pelo tratamento */}
        <Section id="responsavel" icon={<UserCheck size={16} style={{ color: '#0ea5e9' }} />} title="1. Responsavel pelo Tratamento de Dados">
          <Ul>
            <Li><strong>Empresa:</strong> {EMPRESA}</Li>
            <Li><strong>Pais:</strong> {MORADA}</Li>
            <Li><strong>Contacto de privacidade:</strong> <a href={`mailto:${EMAIL_DPO}`} className="underline" style={{ color: '#0ea5e9' }}>{EMAIL_DPO}</a></Li>
          </Ul>
          <P>
            Para qualquer questao relacionada com o tratamento dos seus dados pessoais, pode contactar-nos atraves do email acima indicado.
          </P>
        </Section>

        {/* 2. Dados recolhidos */}
        <Section id="dados" icon={<FileText size={16} style={{ color: '#0ea5e9' }} />} title="2. Dados Pessoais Recolhidos">
          <P>Recolhemos os seguintes dados pessoais:</P>
          <Ul>
            <Li><strong>Dados de identificacao:</strong> nome completo, empresa, numero de telefone, email.</Li>
            <Li><strong>Dados de acesso:</strong> endereco IP, tipo de browser, sistema operativo, data e hora de acesso.</Li>
            <Li><strong>Dados de utilizacao:</strong> paginas visitadas, accoes realizadas na plataforma, documentos carregados.</Li>
            <Li><strong>Dados de clientes:</strong> informacoes sobre os clientes dos parceiros (nome, contacto, dados do contrato) necessarias para a prestacao do servico.</Li>
            <Li><strong>Dados de cookies:</strong> preferencias de consentimento, identificadores de sessao.</Li>
          </Ul>
          <P>Nao recolhemos categorias especiais de dados (dados de saude, origem racial, etc.) salvo consentimento expresso.</P>
        </Section>

        {/* 3. Finalidades e bases legais */}
        <Section id="finalidades" icon={<Lock size={16} style={{ color: '#0ea5e9' }} />} title="3. Finalidades do Tratamento e Bases Legais">
          <div className="space-y-4">
            {[
              {
                titulo: 'Prestacao do servico (contrato)',
                base: 'Execucao de contrato — Art. 6(1)(b) RGPD',
                items: ['Autenticacao e gestao de conta', 'Gestao de vendas e comissoes', 'Comunicacoes relacionadas com o servico']
              },
              {
                titulo: 'Obrigacoes legais',
                base: 'Obrigacao legal — Art. 6(1)(c) RGPD',
                items: ['Cumprimento de obrigacoes fiscais e contabilisticas', 'Resposta a pedidos de autoridades competentes']
              },
              {
                titulo: 'Interesses legitimos',
                base: 'Interesse legitimo — Art. 6(1)(f) RGPD',
                items: ['Seguranca e prevencao de fraude', 'Melhoria da plataforma com dados anonimizados']
              },
              {
                titulo: 'Consentimento',
                base: 'Consentimento — Art. 6(1)(a) RGPD',
                items: ['Cookies analiticos e de marketing (quando aceites)', 'Comunicacoes de marketing (quando autorizado)']
              },
            ].map(item => (
              <div key={item.titulo} className="rounded-xl p-4" style={{ background: '#f9fafb', border: '1px solid #e2e8f0' }}>
                <p className="font-semibold text-sm mb-0.5" style={{ color: '#1e293b' }}>{item.titulo}</p>
                <p className="text-xs mb-2 font-medium" style={{ color: '#0ea5e9' }}>{item.base}</p>
                <Ul>{item.items.map(i => <Li key={i}>{i}</Li>)}</Ul>
              </div>
            ))}
          </div>
        </Section>

        {/* 4. Cookies */}
        <Section id="cookies" icon={<Cookie size={16} style={{ color: '#0ea5e9' }} />} title="4. Politica de Cookies">
          <P>Utilizamos cookies e tecnologias semelhantes para melhorar a sua experiencia. Seguem-se os tipos de cookies utilizados:</P>
          <div className="space-y-3">
            {[
              {
                tipo: 'Cookies necessarios',
                cor: '#d1fae5', textCor: '#065f46',
                desc: 'Essenciais para o funcionamento da plataforma. Incluem cookies de sessao, autenticacao e seguranca (CSRF). Nao requerem consentimento.',
                exemplos: ['sb-auth-token (sessao Supabase)', 'sd_cookie_consent (preferencias de cookies)']
              },
              {
                tipo: 'Cookies analiticos',
                cor: '#e0e7ff', textCor: '#4338ca',
                desc: 'Permitem-nos analisar o comportamento dos utilizadores para melhorar a plataforma. Os dados sao anonimizados e nao identificam individualmente o utilizador.',
                exemplos: ['Metricas de paginas visitadas', 'Tempo de sessao anonimizado']
              },
              {
                tipo: 'Cookies de marketing',
                cor: '#fef3c7', textCor: '#92400e',
                desc: 'Utilizados para personalizar comunicacoes e campanhas relevantes. Requerem consentimento expresso.',
                exemplos: ['Identificadores de campanha anonimizados']
              },
            ].map(c => (
              <div key={c.tipo} className="rounded-xl p-4" style={{ background: '#f9fafb', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: c.cor, color: c.textCor }}>{c.tipo}</span>
                </div>
                <P>{c.desc}</P>
                <p className="text-xs mt-2 font-medium" style={{ color: '#64748b' }}>Exemplos: {c.exemplos.join(', ')}</p>
              </div>
            ))}
          </div>
          <P>
            Pode gerir as suas preferencias de cookies a qualquer momento atraves das definicoes do seu browser ou contactando-nos.
            A rejeicao de cookies opcionais nao afecta o funcionamento essencial da plataforma.
          </P>
        </Section>

        {/* 5. Partilha de dados */}
        <Section id="partilha" icon={<Eye size={16} style={{ color: '#0ea5e9' }} />} title="5. Partilha e Transferencia de Dados">
          <P>Nao vendemos nem cedemos os seus dados pessoais a terceiros para fins comerciais. Partilhamos dados apenas nas seguintes situacoes:</P>
          <Ul>
            <Li><strong>Prestadores de servicos:</strong> Supabase (base de dados e autenticacao, alojado na UE), Vercel (alojamento, com certificacao GDPR).</Li>
            <Li><strong>Obrigacoes legais:</strong> Quando exigido por lei, regulamentacao ou ordem judicial.</Li>
            <Li><strong>Proteccao de direitos:</strong> Para proteger os direitos, propriedade ou seguranca da empresa ou de terceiros.</Li>
          </Ul>
          <div className="rounded-xl p-4 mt-3" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#166534' }}>Transferencias internacionais</p>
            <p className="text-sm" style={{ color: '#166534' }}>
              Os dados sao processados predominantemente na Uniao Europeia. Quando houver transferencias para paises terceiros,
              garantimos mecanismos adequados de proteccao (Clausulas Contratuais Padrao ou decisao de adequacao da Comissao Europeia).
            </p>
          </div>
        </Section>

        {/* 6. Retencao */}
        <Section id="retencao" icon={<Trash2 size={16} style={{ color: '#0ea5e9' }} />} title="6. Retencao de Dados">
          <Ul>
            <Li><strong>Dados de conta activa:</strong> mantidos enquanto a conta estiver activa.</Li>
            <Li><strong>Dados de vendas e comissoes:</strong> 7 anos (obrigacao fiscal e contabilistica).</Li>
            <Li><strong>Registos de consentimento:</strong> 3 anos apos o ultimo consentimento.</Li>
            <Li><strong>Logs de acesso (IP):</strong> maximos 12 meses.</Li>
            <Li><strong>Apos eliminacao de conta:</strong> os dados sao anonimizados ou eliminados no prazo de 30 dias, excepto os que tenhamos obrigacao legal de conservar.</Li>
          </Ul>
          <div className="rounded-xl p-4 mt-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#991b1b' }}>Nota importante sobre eliminacao de conta</p>
            <p className="text-sm" style={{ color: '#991b1b' }}>
              Quando uma conta e eliminada, o email associado e registado na nossa lista de controlo para impedir
              a criacao de novas contas com o mesmo email. Esta medida visa proteger a integridade da plataforma
              e cumprir as obrigacoes legais aplicaveis. Para solicitar a remocao desta restricao, contacte {EMAIL_DPO}.
            </p>
          </div>
        </Section>

        {/* 7. Direitos do titular */}
        <Section id="direitos" icon={<UserCheck size={16} style={{ color: '#0ea5e9' }} />} title="7. Os seus Direitos (RGPD)">
          <P>Ao abrigo do RGPD, tem os seguintes direitos relativamente aos seus dados pessoais:</P>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { titulo: 'Direito de acesso (Art. 15)', desc: 'Obter confirmacao sobre se os seus dados sao tratados e aceder a uma copia.' },
              { titulo: 'Direito de rectificacao (Art. 16)', desc: 'Corrigir dados inexactos ou incompletos.' },
              { titulo: 'Direito ao apagamento (Art. 17)', desc: 'Solicitar a eliminacao dos seus dados ("direito ao esquecimento").' },
              { titulo: 'Direito de portabilidade (Art. 20)', desc: 'Receber os seus dados num formato estruturado e legivel por maquina.' },
              { titulo: 'Direito de oposicao (Art. 21)', desc: 'Opor-se ao tratamento com base em interesses legitimos ou para fins de marketing.' },
              { titulo: 'Direito de limitacao (Art. 18)', desc: 'Solicitar a limitacao do tratamento em determinadas circunstancias.' },
            ].map(d => (
              <div key={d.titulo} className="rounded-xl p-4" style={{ background: '#f9fafb', border: '1px solid #e2e8f0' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#1e293b' }}>{d.titulo}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{d.desc}</p>
              </div>
            ))}
          </div>
          <P>
            Para exercer qualquer um destes direitos, envie um pedido por email para{' '}
            <a href={`mailto:${EMAIL_DPO}`} className="underline font-medium" style={{ color: '#0ea5e9' }}>{EMAIL_DPO}</a>.
            Responderemos no prazo de 30 dias. Tem tambem o direito de apresentar queixa a{' '}
            <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer" className="underline" style={{ color: '#0ea5e9' }}>CNPD (Comissao Nacional de Proteccao de Dados)</a>.
          </P>
        </Section>

        {/* 8. Seguranca */}
        <Section id="seguranca" icon={<Lock size={16} style={{ color: '#0ea5e9' }} />} title="8. Seguranca dos Dados">
          <P>Implementamos medidas tecnicas e organizativas adequadas para proteger os seus dados pessoais:</P>
          <Ul>
            <Li>Transmissao encriptada via HTTPS/TLS em todos os acessos.</Li>
            <Li>Autenticacao segura com gestao de sessoes (Supabase Auth).</Li>
            <Li>Controlo de acessos baseado em funcoes (Row Level Security).</Li>
            <Li>Backups regulares com encriptacao em repouso.</Li>
            <Li>Revisao periodica das politicas de seguranca e acesso.</Li>
          </Ul>
          <P>
            Em caso de violacao de dados que represente risco elevado para os seus direitos e liberdades, notificaremos
            a CNPD no prazo de 72 horas e, quando aplicavel, os titulares afectados.
          </P>
        </Section>

        {/* 9. Contacto */}
        <Section id="contacto" icon={<Mail size={16} style={{ color: '#0ea5e9' }} />} title="9. Contacto e Alteracoes a esta Politica">
          <P>
            Para qualquer questao, pedido de exercicio de direitos ou reclamacao, contacte-nos em:{' '}
            <a href={`mailto:${EMAIL_DPO}`} className="underline font-medium" style={{ color: '#0ea5e9' }}>{EMAIL_DPO}</a>
          </P>
          <P>
            Reservamo-nos o direito de actualizar esta politica para reflectir alteracoes legais ou operacionais.
            A data de ultima actualizacao e sempre indicada no topo da pagina. Alteracoes significativas serao comunicadas
            por email ou atraves da plataforma.
          </P>
          <div className="rounded-xl p-4 mt-2" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
            <p className="text-sm" style={{ color: '#0ea5e9' }}>
              <strong>Versao actual:</strong> {DATA_ACTUALIZACAO} — Esta politica esta em conformidade com o RGPD (Regulamento UE 2016/679)
              e a Lei n.o 58/2019, de 8 de agosto (lei nacional de proteccao de dados pessoais de Portugal).
            </p>
          </div>
        </Section>

        {/* Indice lateral rapido */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9ca3af' }}>Indice rapido</p>
          <div className="flex flex-wrap gap-2">
            {[
              ['#responsavel', '1. Responsavel'],
              ['#dados', '2. Dados recolhidos'],
              ['#finalidades', '3. Finalidades'],
              ['#cookies', '4. Cookies'],
              ['#partilha', '5. Partilha'],
              ['#retencao', '6. Retencao'],
              ['#direitos', '7. Os seus direitos'],
              ['#seguranca', '8. Seguranca'],
              ['#contacto', '9. Contacto'],
            ].map(([href, label]) => (
              <a key={href} href={href}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                style={{ background: '#eef2ff', color: '#0ea5e9', border: '1px solid #c7d2fe' }}>
                {label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
