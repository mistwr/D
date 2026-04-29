# Guia de Debug - Problema de Sessão

## Problema
Após registar parceiro funciona, mas ao navegar para outras abas volta ao login e a sessão não persiste.

## Causa Raiz Identificada
O cookie `sd_session` com `httpOnly: true` pode não estar sendo enviado automaticamente pelo navegador em alguns cenários, ou o middleware está rejeita nd. Adicionamos melhorias para rastrear o problema.

## Fluxo de Autenticação Melhorado

### 1. **Register** (`/app/api/auth/register/route.ts`)
- Cria utilizador em store local
- Tenta sincronizar com Supabase (async, não bloqueia)
- Define cookie `sd_session` com token base64
- Retorna utilizador ao frontend

### 2. **Login** (`/app/api/auth/login/route.ts`)
- Verifica Supabase primeiro (mais confiável)
- Fallback para store local se não encontrar
- Define cookie `sd_session`
- Envia JSON com utilizador

### 3. **Middleware** (`/middleware.ts`)
- Rotas públicas: `/`, `/login`, `/register`, `/sobre`
- APIs públicas: `/api/auth/*`
- Rotas protegidas: verificam cookie `sd_session`
- Se sem cookie → redireciona para `/login`

### 4. **Hook useAuth** (`/hooks/use-auth.ts`)
- Verifica `/api/auth/me` ao montar componente
- Valida se utilizador tem role correto
- Redireciona se não autenticado
- Logs verbosos para debug

### 5. **Me API** (`/app/api/auth/me/route.ts`)
- Lê cookie `sd_session`
- Descodifica token base64
- Busca utilizador no store
- Retorna dados do utilizador

## Como Testar

### Console Browser (F12)
```javascript
// Verificar se cookie existe
console.log(document.cookie)

// Deve conter: sd_session=base64_token

// Fazer request manual
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log(d))
```

### Logs no Servidor
Abrir F12 → Network → filtrar XHR
- Login: Verificar cookie em Response Headers
- Dashboard carregamento: Ver logs `[v0]` do middleware

## Mudanças Principais

1. **Register** agora sincroniza com Supabase
2. **Login** tenta Supabase primeiro, depois local
3. **Middleware** melhorado com rotas públicas explícitas
4. **useAuth Hook** com logging detalhado
5. **Logout API** com logs

## Próximos Passos se Ainda Falhar

Se login ainda não funcionar após estas mudanças:

1. Verificar em browser console se cookie `sd_session` aparece depois do login
2. Verificar se `/api/auth/me` retorna o utilizador quando chamada
3. Verificar network requests no F12 para ver headers de cookies
4. Verificar environment variables do Supabase estão setadas em Vercel

## Comandos para Testar Localmente

```bash
# Terminal 1: Executar aplicação
npm run dev

# Terminal 2: Testar fluxo
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","full_name":"Test User"}' \
  -c cookies.txt

# Verificar sessão
curl http://localhost:3000/api/auth/me -b cookies.txt
```
