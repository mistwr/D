#!/bin/bash

# Script para Setup Inicial do CRM

echo "🚀 Setup Inicial - CRM Soluções Diferentes"
echo "=========================================="

# 1. Instalar dependências
echo "📦 Instalando dependências..."
pnpm install

# 2. Verificar arquivo .env
echo "🔧 Verificando arquivo .env..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ Arquivo .env.local criado a partir de .env.example"
  echo "⚠️  Adicione suas variáveis Supabase ao .env.local"
fi

# 3. Build
echo "🔨 Build do projeto..."
pnpm build

# 4. Mensagem final
echo ""
echo "✅ Setup completo!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Configurar NEXT_PUBLIC_SUPABASE_URL no .env.local"
echo "2. Configurar NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local"
echo "3. Executar: pnpm dev"
echo ""
echo "Aceder a: http://localhost:3000"
