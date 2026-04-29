# Setup Supabase para o CRM Solucoes Diferentes

## 1. Integração Já Configurada

O projeto já tem a integração Supabase conectada no Vercel. As variáveis de ambiente necessárias estão configuradas:

```
SUPABASE_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
POSTGRES_URL
POSTGRES_URL_NON_POOLING
POSTGRES_PRISMA_URL
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_HOST
POSTGRES_DATABASE
```

## 2. Executar a Migration

Para criar o schema (tabelas, indexes, RLS policies) no Supabase:

### Opção A: Via Supabase Dashboard
1. Ir para https://supabase.com/dashboard
2. Seleccionar o seu projeto
3. Ir para "SQL Editor"
4. Criar uma nova query
5. Copiar e colar o conteúdo de `/scripts/01-create-schema.sql`
6. Executar (Ctrl+Enter ou botão "Run")

### Opção B: Via CLI (se instalado)
```bash
supabase db push --file ./scripts/01-create-schema.sql
```

## 3. Schema Criado

A migration cria as seguintes tabelas:

### users
- Extensão da tabela `auth.users` do Supabase
- Campos: id, email, full_name, company_name, role (admin/parceiro)

### vendas
- id, user_id, client_name, client_email, client_phone
- amount, currency, description, contract_type
- service_type (energia/telecom), operator
- status (pendente/em_revisao/ativa/processado/pago/cancelado/rejeitado)
- notes, created_at, updated_at

### documentos
- id, venda_id, file_name, file_type, file_size
- file_data (base64 encoded)
- uploaded_by, created_at

### campanhas
- id, title, operator, service_type
- description, status (ativa/inativa/terminada)
- created_at

### campanha_pdfs
- id, campanha_id, file_name, uploaded_at

### publicacoes
- id, title, message, document_name
- created_by, created_at

### publicacao_recipients
- id, publicacao_id, user_id (many-to-many)

### notificacoes
- id, user_id, title, message
- is_read, created_at

### comissoes
- parceiro_id, energia_percent, telecom_percent
- energia_fixo, telecom_fixo, updated_at

## 4. Row Level Security (RLS)

Todas as tabelas têm RLS policies habilitadas:

- **Users**: Cada utilizador vê apenas seu perfil, admin vê todos
- **Vendas**: Parceiro vê suas vendas, admin vê todas
- **Documentos**: Utilizador vê docs das suas vendas
- **Campanhas**: Public read, admin write
- **Publicacoes**: Utilizador vê suas publicações
- **Notificacoes**: Utilizador vê suas notificações
- **Comissoes**: Parceiro vê sua, admin vê todas

## 5. Migrações Futuras

Novos ficheiros SQL devem ser criados em `/scripts/` com padrão:
- `02-add-column.sql`
- `03-create-table.sql`
- etc.

Depois executados manualmente via Supabase Dashboard.

## 6. Backup & Restore

Supabase faz backups automáticos diários. Para restaurar:
1. Dashboard > Settings > Backups
2. Seleccionar backup e restaurar

## 7. Troubleshooting

### Erro: "No tenant found"
- Verificar que SUPABASE_URL está correcto em Vercel env vars

### Erro: "Invalid API Key"
- Confirmar NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local ou Vercel

### Erro: "RLS policy violation"
- Confirmar que o utilizador está autenticado (JWT token)
- Verificar RLS policies no Supabase Dashboard > Auth > Policies

### Dados não aparecem no admin
- Confirmar role='admin' no campo role da tabela users
- Recarregar página (cache)

## 8. Próximos Passos

Agora que Supabase está configurado, o código deve ser migrado para usar:
1. Supabase client (@supabase/supabase-js) em vez de store em memoria
2. API routes que chamam Supabase
3. Autenticação nativa Supabase Auth

Isso será um migração grande do código existente.
