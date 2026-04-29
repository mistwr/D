# Guia de Setup - CRM Soluções Diferentes

## Problema: Login não funciona e diz sempre "Email ou senha incorretos"

### Causa Raiz
As tabelas do Supabase não foram criadas corretamente. O código espera uma tabela `users` com colunas específicas.

### Solução Passo a Passo

#### 1. Abrir Supabase SQL Editor
- Ir a https://app.supabase.com
- Selecionar seu projeto
- Clicar em "SQL Editor" no menu esquerdo
- Clicar em "New Query"

#### 2. Executar o Script SQL de Setup
A página `/setup` (http://localhost:3000/setup ou sua URL em produção) contém o script completo que deve ser executado.

**Copiar TODO o SQL da página de setup e colar no Supabase SQL Editor**

#### 3. Executar o Query
- Colar o SQL
- Clicar em "Run" ou pressionar Ctrl+Enter
- Esperar pela mensagem de sucesso

#### 4. Verificar se Funcionou
- Voltar a http://localhost:3000/setup
- Clicar em "Verificar Schema"
- Deverá aparecer mensagem com sucesso

#### 5. Testar Login
- Ir a http://localhost:3000/register
- Criar uma conta nova
- Tentar fazer login

### Estrutura de Tabelas Criadas

```
users
├── id (UUID, primary key)
├── email (unique)
├── password
├── full_name
├── role (parceiro ou admin)
├── company_name
├── phone
└── timestamps

contratos
├── id (UUID)
├── user_id (FK → users)
├── client_name
├── client_phone
├── servico_type (energia/telecom)
├── operadora
├── status (rascunho/pendente_cliente/pendente_vendedor/finalizado)
├── assinado_cliente (boolean)
├── assinado_vendedor (boolean)
└── timestamps

contrato_assinaturas
├── id (UUID)
├── contrato_id (FK → contratos)
├── tipo (cliente/vendedor)
├── assinante_id (FK → users)
├── signature_image_base64
├── ip_address
└── created_at

vendas
├── id (UUID)
├── user_id (FK → users)
├── client_name
├── amount
├── status
└── timestamps

comissoes_por_operadora
├── id (UUID)
├── admin_id (FK → users)
├── operadora
├── servico_type
├── percentual
└── valor_fixo
```

### Debug Logs Adicionados
Se ainda tiver problemas, abra a consola (F12) e procure por logs com `[v0]`:

- `[v0] Login: email=...` - tentativa de login
- `[v0] supabaseStore: getUserByEmail result` - busca no Supabase
- `[v0] Register: Criando user...` - criação de utilizador
- `[v0] Register: User criado?` - resultado da criação

### Verificação Rápida
1. Abrir Supabase console
2. Ir a SQL Editor
3. Executar: `SELECT COUNT(*) FROM users;`
4. Deverá retornar 0 ou mais registos

Se der erro "Table doesn't exist", é porque o setup SQL não foi executado.

### Criar Admin (Opcional)
Após o setup funcionar, pode criar um admin diretamente no Supabase:

```sql
INSERT INTO users (email, password, full_name, role, company_name, phone) 
VALUES ('admin@example.com', 'admin123', 'Admin', 'admin', 'Admin', '+351 123 456 789');
```

Depois fazer login com: admin@example.com / admin123
