# Solucoes Diferentes - CRM Web

Plataforma completa de gestão de vendas para parceiros de **Energia** e **Telecomunicações**, com suporte a campanhas, documentos, simulador de comissões e integração Supabase.

## 🚀 Funcionalidades

### Para Parceiros
- ✅ **Dashboard** com métricas em tempo real (vendas, comissões, clientes)
- ✅ **Registar Vendas** com cliente, serviço (energia/telecom), operadora e valor
- ✅ **Upload de Documentos** (contratos, faturas, PDFs) por venda
- ✅ **Simulador de Comissões** - calcular ganhos por tipo de serviço
- ✅ **Visualizar Publicações** enviadas pelo admin
- ✅ **Compartilhar por WhatsApp** campanhas e publicações

### Para Admin
- ✅ **Dashboard Global** - visualizar todas as vendas e parceiros
- ✅ **Gerir Parceiros** - definir comissões por serviço (% + fixo)
- ✅ **Campanhas** - criar por operadora/serviço com PDFs anexados
- ✅ **Import em Massa** - carregar Excel com estado das vendas
- ✅ **Upload de PDFs** para campanhas de vendas
- ✅ **Publicacoes** - enviar materiais de venda a parceiros selecionados
- ✅ **Visualizar Documentos** carregados pelos parceiros (com download)
- ✅ **Compartilhar por WhatsApp** campanhas e documentos

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: TailwindCSS v4
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL (com RLS)
- **Auth**: Session-based (cookies) com JWT
- **Storage**: Base64 em memória + Supabase
- **Deploy**: Vercel

## 📋 Estrutura do Projeto

```
/app
  /layout.tsx (root layout)
  /page.tsx (home/redirect)
  /sobre/ (página info do CRM)
  /login/ (autenticação)
  /register/ (registar parceiro)
  /dashboard/ (dashboard parceiro)
  /admin/ (área admin)
    /dashboard/ (visão global)
    /parceiros/ (gestão de parceiros + comissões)
    /campanhas/ (criar campanhas com PDFs)
    /publicar/ (enviar publicações)
    /documentos/ (visualizar docs carregados)
    /import/ (import Excel com estados)
  /vendas/ (gestão de vendas)
    /page.tsx (listar vendas)
    /novo/ (registar nova venda + upload docs)
  /documentos/ (visualizar docs parceiro)
  /publicacoes/ (publicações do admin)
  /simulador/ (simulador de comissões)

/lib
  /store.ts (data store em memória)
  /utils.ts

/api
  /auth/ (login, register, logout, me)
  /vendas/ (CRUD vendas)
  /documentos/ (upload/list docs)
  /campanhas/ (CRUD campanhas + PDFs)
  /publicacoes/ (CRUD publicações)
  /comissoes/ (calcular comissões)
  /notificacoes/ (push notificações)
  /import/ (import CSV)

/components
  /navbar.tsx (navegação superior)
  /sidebar.tsx (menu lateral)
```

## 🔐 Autenticação & Segurança

- **Email/Password** via `/api/auth/login` e `/api/auth/register`
- **Session Token** guardado em cookie `sd_session` (base64 JSON)
- **Roles**: `admin` (acesso total) | `parceiro` (acesso limitado)
- **RLS Policies** no Supabase para segurança em nível BD
- **HTTPS** obrigatório em produção

### Credenciais Demo
```
Email: admin
Password: admin
```

## 🗄️ Database (Supabase)

Ver `SUPABASE_SETUP.md` para instruções de setup.

### Tabelas Principais
- `users` - perfis (admin/parceiro) com RLS
- `vendas` - registro com 7 estados
- `documentos` - PDFs/contratos com base64
- `campanhas` - por operadora/serviço
- `campanha_pdfs` - anexos de campanha
- `publicacoes` - materiais de venda
- `comissoes` - % + valores fixos
- `notificacoes` - sistema de alertas

## 📱 Operadores Suportados

**Energia**: EDP, Endesa, Galp, Iberdrola, Gold Energy, Luzboa

**Telecomunicações**: MEO, NOS, Vodafone, NOWO

## 💡 Fluxo de Uso

1. Parceiro registra (email + password)
2. Admin define comissões (% energia, % telecom, valores fixos)
3. Parceiro registra venda (serviço + operadora)
4. Parceiro faz upload de documentos
5. Admin cria campanhas com PDFs
6. Admin envia publicações a parceiros
7. Parceiro usa simulador - calcula ganhos
8. Todos compartilham por WhatsApp

## 🔄 Estados de Venda

- `pendente` - inicial
- `em_revisao` - admin revê
- `ativa` - contrato ativo
- `processado` - docs processados
- `pago` - pagamento recebido
- `cancelado` - cliente cancelou
- `rejeitado` - admin rejeitou

## 📞 Integração WhatsApp

Botões "Compartilhar WhatsApp" abrem `https://wa.me/?text=...` com mensagem pré-preenchida.

## 🚀 Deploy

```bash
# Local
npm install
npm run dev
# http://localhost:3000

# Vercel (Recomendado)
# 1. Push código para GitHub
# 2. Conectar repo no Vercel
# 3. Adicionar env vars Supabase
# 4. Deploy automático
```

## 📚 Documentação

- `SUPABASE_SETUP.md` - Configurar Supabase
- `/scripts/01-create-schema.sql` - Schema SQL completo
- `/app/sobre/page.tsx` - Página pública sobre o CRM

## 🛡️ Segurança

- RLS policies no Supabase
- JWT tokens com session cookies
- Validação input em API routes
- Dados sensíveis não expostos
- Rate limiting recomendado em produção

## 📊 Próximas Funcionalidades

- [ ] Gráficos de vendas (charts)
- [ ] Exportação CSV/PDF de relatórios
- [ ] Webhooks para sincronização
- [ ] API pública
- [ ] SMS para confirmações
- [ ] Análise IA

---

**v2.0** - Com Supabase integrado | Página home funcional
