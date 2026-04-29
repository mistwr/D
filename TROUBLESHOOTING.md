# Troubleshooting - Solucoes Diferentes CRM

## Problema: Não consegue fazer login com admin/admin

### O que foi corrigido:
1. **Cookie HTTP-Only** - Agora corretamente enviado no response header (não na página)
2. **Redirect melhorado** - Usa `router.replace()` em vez de `window.location.href` para preservar sessão
3. **Verificação de sessão** - Valida cookie ANTES de fazer redirect
4. **Debug logs** - Adicionados console.log para rastrear fluxo

### Como testar:

#### 1. Teste de Login (Admin)
```
Email: admin
Senha: admin
```

**O que deve acontecer:**
- Browser console mostra: `[v0] Login response: 200 {...}`
- Browser console mostra: `[v0] Me response after login: 200 {...}`
- Redireciona para `/admin/dashboard`
- URL muda para `/admin/dashboard`
- Pode ver navbar e sidebar

#### 2. Teste de Registro (Novo Parceiro)
```
Nome: Teste Parceiro
Email: teste@example.com
Empresa: Minha Empresa
Telefone: +351900000000
Senha: senha123
Confirmar: senha123
```

**O que deve acontecer:**
- Browser console mostra: `[v0] Register attempt: teste@example.com Teste Parceiro`
- Browser console mostra: `[v0] User created: {...}` com novo ID
- Browser console mostra: `[v0] Me response after register: 200 {...}`
- Redireciona para `/dashboard`
- Pode fazer login com esse email/senha

#### 3. Verificar Cookies
```javascript
// Cole no browser console (F12):
console.log('Cookies:', document.cookie)
console.log('Session token:', document.cookie.split('sd_session=')[1])
```

**Deve mostrar:**
- `sd_session=<base64>` no document.cookie
- Se vazio = cookies não estão sendo aceitos

#### 4. Verificar API Me
```javascript
// Cole no browser console:
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Auth status:', d))
```

**Deve mostrar:**
```json
{
  "user": {
    "id": "admin-001",
    "email": "admin",
    "full_name": "Administrador",
    "role": "admin",
    "company_name": "Solucoes Diferentes"
  }
}
```

Se mostra `{"user":null}` = sessão perdida

### Problemas Comuns:

#### ❌ "Erro de ligacao" (Login falha completamente)
**Causa**: Servidor não respondendo
**Solução**: 
- Verifique se app está running: `npm run dev`
- Verifique localhost:3000
- Limpe cache/cookies do browser

#### ❌ Login retorna 200 OK mas não redireciona
**Causa**: Cookie não foi aceito pelo browser
**Solução**:
- Abra DevTools (F12) → Network
- Clique em "Entrar"
- Procure request POST `/api/auth/login`
- Verifique na aba "Response Headers" se tem `Set-Cookie: sd_session=...`
- Se tem mas não aparece cookie, pode ser problema de HTTPS em produção

#### ❌ Redireciona mas fica em loop ou pagina em branco
**Causa**: Middleware está bloqueando ou componente tem erro
**Solução**:
- Abra DevTools (F12) → Console
- Procure erro JavaScript (red messages)
- Verifique se componentes Navbar/Sidebar estão importando corretamente

#### ❌ Admin/admin não existe
**Causa**: Store não inicializou
**Solução**:
- Verifique `/lib/store.ts` linha 94-105
- Admin deve estar na array `users` com id: 'admin-001'
- Se não existir, restart do servidor

### Debug Step-by-Step:

1. **Abra DevTools**: F12
2. **Vá a Console**: procure [v0] logs
3. **Tente login com admin/admin**
4. **Verifique logs em ordem**:
   - `[v0] Login response: 200` ✅ API respondeu
   - `[v0] Me response after login: 200` ✅ Cookie foi aceito
   - Se tem `401` = cookie perdido
5. **Se não há logs**:
   - Aplicação pode ter crashado
   - Verifique aba "Network" → filtro "Fetch/XHR"
   - Veja se `/api/auth/login` tem erro HTTP

### Otimizações Aplicadas:

✅ Cookie com `secure: process.env.NODE_ENV === 'production'`
✅ Delay de 200ms antes de verificar sessão
✅ Validação de cookie ANTES de redirect
✅ Console logs em cada etapa
✅ SameSite: 'lax' para compatibilidade
✅ router.replace() em vez de window.location.href

### Próximos Passos se Persistir:

1. Coleta os logs completos do console
2. Verifica Network tab → headers de Set-Cookie
3. Testa em incognito/private window (sem cache)
4. Teste em diferente browser
5. Verifique se cookies estão ativados no browser

---

**Versão**: 2.0 com correcção de autenticação
**Data**: 2024-03-06
