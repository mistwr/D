-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  company_name text,
  role text default 'parceiro' check (role in ('admin', 'parceiro')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Vendas table
create table if not exists public.vendas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users on delete cascade,
  client_name text not null,
  client_email text not null,
  client_phone text,
  amount decimal(10, 2) not null,
  currency text default 'EUR',
  description text,
  contract_type text,
  service_type text check (service_type in ('energia', 'telecom')),
  operator text,
  status text default 'pendente' check (status in ('pendente', 'em_revisao', 'ativa', 'processado', 'pago', 'cancelado', 'rejeitado')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Documentos table
create table if not exists public.documentos (
  id uuid primary key default uuid_generate_v4(),
  venda_id uuid not null references public.vendas on delete cascade,
  file_name text not null,
  file_type text,
  file_size integer,
  file_data text, -- base64 encoded file content
  uploaded_by uuid not null references public.users on delete cascade,
  created_at timestamp with time zone default now()
);

-- Campanhas table
create table if not exists public.campanhas (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  operator text not null,
  service_type text check (service_type in ('energia', 'telecom')),
  description text,
  status text default 'ativa' check (status in ('ativa', 'inativa', 'terminada')),
  created_at timestamp with time zone default now()
);

-- Campanha PDFs table
create table if not exists public.campanha_pdfs (
  id uuid primary key default uuid_generate_v4(),
  campanha_id uuid not null references public.campanhas on delete cascade,
  file_name text not null,
  uploaded_at timestamp with time zone default now()
);

-- Publicacoes table
create table if not exists public.publicacoes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  message text,
  document_name text,
  created_by uuid not null references public.users on delete cascade,
  created_at timestamp with time zone default now()
);

-- Publicacao recipients (many-to-many)
create table if not exists public.publicacao_recipients (
  id uuid primary key default uuid_generate_v4(),
  publicacao_id uuid not null references public.publicacoes on delete cascade,
  user_id uuid not null references public.users on delete cascade,
  unique(publicacao_id, user_id)
);

-- Notificacoes table
create table if not exists public.notificacoes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users on delete cascade,
  title text,
  message text,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Comissoes table
create table if not exists public.comissoes (
  parceiro_id uuid primary key references public.users on delete cascade,
  energia_percent decimal(5, 2) default 0,
  telecom_percent decimal(5, 2) default 0,
  energia_fixo decimal(10, 2) default 0,
  telecom_fixo decimal(10, 2) default 0,
  updated_at timestamp with time zone default now()
);

-- Create indexes for performance
create index if not exists idx_vendas_user_id on public.vendas(user_id);
create index if not exists idx_vendas_status on public.vendas(status);
create index if not exists idx_vendas_created_at on public.vendas(created_at);
create index if not exists idx_documentos_venda_id on public.documentos(venda_id);
create index if not exists idx_documentos_uploaded_by on public.documentos(uploaded_by);
create index if not exists idx_notificacoes_user_id on public.notificacoes(user_id);
create index if not exists idx_publicacao_recipients_user_id on public.publicacao_recipients(user_id);

-- Enable RLS
alter table public.users enable row level security;
alter table public.vendas enable row level security;
alter table public.documentos enable row level security;
alter table public.campanhas enable row level security;
alter table public.campanha_pdfs enable row level security;
alter table public.publicacoes enable row level security;
alter table public.publicacao_recipients enable row level security;
alter table public.notificacoes enable row level security;
alter table public.comissoes enable row level security;

-- RLS Policies - Users
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);
create policy "Admin can view all users" on public.users
  for select using (
    auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );

-- RLS Policies - Vendas
create policy "Parceiros can view their own vendas" on public.vendas
  for select using (auth.uid() = user_id);
create policy "Admin can view all vendas" on public.vendas
  for select using (
    auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );
create policy "Parceiros can insert their own vendas" on public.vendas
  for insert with check (auth.uid() = user_id);
create policy "Parceiros can update their own vendas" on public.vendas
  for update using (auth.uid() = user_id);

-- RLS Policies - Documentos
create policy "Users can view docs from their vendas" on public.documentos
  for select using (
    auth.uid() in (
      select user_id from public.vendas where id = venda_id
    ) or auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );
create policy "Users can upload docs to their vendas" on public.documentos
  for insert with check (
    auth.uid() in (
      select user_id from public.vendas where id = venda_id
    )
  );

-- RLS Policies - Campanhas (public read, admin write)
create policy "Everyone can view campanhas" on public.campanhas
  for select using (true);
create policy "Admin can manage campanhas" on public.campanhas
  for all using (
    auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );

-- RLS Policies - Campanha PDFs
create policy "Everyone can view campanha pdfs" on public.campanha_pdfs
  for select using (true);
create policy "Admin can manage campanha pdfs" on public.campanha_pdfs
  for all using (
    auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );

-- RLS Policies - Publicacoes
create policy "Users can view their publicacoes or sent to them" on public.publicacoes
  for select using (
    auth.uid() = created_by or auth.uid() in (
      select user_id from public.publicacao_recipients where publicacao_id = id
    ) or auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );
create policy "Admin can create publicacoes" on public.publicacoes
  for insert with check (
    auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );

-- RLS Policies - Publicacao Recipients
create policy "Users can view recipients for their publicacoes" on public.publicacao_recipients
  for select using (
    auth.uid() = user_id or publicacao_id in (
      select id from public.publicacoes where created_by = auth.uid()
    )
  );

-- RLS Policies - Notificacoes
create policy "Users can view their own notificacoes" on public.notificacoes
  for select using (auth.uid() = user_id);
create policy "Users can update their own notificacoes" on public.notificacoes
  for update using (auth.uid() = user_id);

-- RLS Policies - Comissoes
create policy "Parceiros can view their own comissoes" on public.comissoes
  for select using (auth.uid() = parceiro_id);
create policy "Admin can view all comissoes" on public.comissoes
  for select using (
    auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );
create policy "Admin can manage comissoes" on public.comissoes
  for all using (
    auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );

-- Insert demo admin user (opcional - comentar/remover em produção)
-- INSERT INTO public.users (id, email, full_name, role) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'admin@solucoes.pt', 'Admin', 'admin')
-- ON CONFLICT DO NOTHING;
