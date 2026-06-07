## Guia de Funcionamento: FA (Formulário de Adesão) & PDFs

### Fluxo Completo

#### 1. ADMIN FAZE UPLOAD DO FA
**Localização:** `/admin/pdf-templates`

- Clique em "Carregar PDF Template"
- Preencha os campos:
  - **Nome:** Ex: "Contrato de Adesão MEO"
  - **Operadora:** MEO
  - **Tipo de Documento:** FA (Formulário de Adesão)
  - **Ficheiro:** Upload do PDF/Documento
- Clique em "Carregar"
- O template fica ativo e pronto para os parceiros usarem

#### 2. PARCEIRO REGISTRA VENDA
**Localização:** `/vendas/novo`

##### Passo 1: Seleciona Tipo de Serviço
- Escolhe "Telecom" (para telecomunicações)

##### Passo 2: Seleciona Operadora
- Escolhe "MEO" (por exemplo)
- Sistema carrega automaticamente todos os templates FA da MEO

##### Passo 3: Seleciona o FA
- Dropdown "Material de Apoio PDF" aparece
- Lista todos os templates disponíveis: "Contrato de Adesão MEO", etc.
- Parceiro seleciona o que deseja usar

##### Passo 4: Preenche dados da venda
- Nome do Cliente
- NIF
- Email
- Telefone
- Morada
- Plano/Pacote
- Valor
- Tipo de Contrato
- Etc.

##### Passo 5: Clica "Registar Venda"
- Sistema valida os dados
- Cria a venda na BD
- **Automaticamente:**
  - Busca o template selecionado
  - Gera PDF preenchido com os dados do cliente
  - Faz download automático do PDF
  - Redireciona para `/vendas`

#### 3. RESULTADO FINAL
O parceiro recebe um PDF preenchido com:
- ✓ Nome, NIF, Email, Telefone, Morada do cliente
- ✓ Operadora, Plano, Data da venda
- ✓ Vendedor, Valor
- ✓ Tudo integrado no template do FA

---

### Requisitos para Funcionar

1. **Admin tem que ter carregado pelo menos 1 FA** em `/admin/pdf-templates`
2. **O FA deve estar ATIVO** (checkmark verde)
3. **O FA deve ser para a operadora correta** (MEO, NOS, Vodafone, etc.)
4. **O FA deve ser do tipo FA** (não "Portabilidade" ou outros)

### Troubleshooting

**Problema:** Dropdown "Material de Apoio PDF" não aparece
- ✓ Verificar se selecionou "Telecom" em Tipo de Serviço
- ✓ Verificar se há templates carregados para a operadora em `/admin/pdf-templates`

**Problema:** PDF não gera ao registar venda
- ✓ Verificar console do browser (F12) para erros
- ✓ Verificar se template está ATIVO (checkmark verde)
- ✓ Verificar se o template foi selecionado no dropdown antes de clicar "Registar"

**Problema:** PDF sai em branco
- ✓ Template precisa ter campos mapeados ou ser um PDF simples que será preenchido
- ✓ Dados do cliente devem estar preenchidos antes de registar

---

### Localidades Importantes

| Função | URL |
|--------|-----|
| Upload de templates FA | `/admin/pdf-templates` |
| Registar venda com FA | `/vendas/novo` |
| Ver vendas geradas | `/vendas` |
| Ver documentos gerados | `/vendas/[id]` → Aba "Documentos" |
