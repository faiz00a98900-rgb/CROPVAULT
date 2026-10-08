-- CropVault — Supabase schema + Row Level Security
-- ============================================================================
-- Authorization lives HERE, not in the frontend. The client only ever uses the
-- public anon key (safe to expose); role + warehouse scope are read from the
-- `profiles` table, and every data policy is enforced at the database layer.
-- The service_role key stays on the server and is NEVER shipped to the browser.
--
-- Run with:  supabase db push   (or paste into the SQL editor)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
-- MANAGER is the top role. 'ADMIN' is kept only as a legacy value so existing
-- rows remain valid; the app maps it to MANAGER and no new admins are created.
create type public.user_role as enum ('MANAGER', 'WAREHOUSE WORKER', 'ADMIN');

-- ---------------------------------------------------------------------------
-- Warehouses (unique ids: warehouse-a, warehouse-b, ...)
-- ---------------------------------------------------------------------------
create table if not exists public.warehouses (
  id         text primary key,          -- e.g. 'warehouse-a'
  name       text not null,
  code       text not null,             -- display badge, e.g. 'A'
  location   text not null,
  capacity   numeric not null default 0
);

-- ---------------------------------------------------------------------------
-- Profiles — the single source of role + warehouse scope, keyed to auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text,
  full_name     text,
  role          public.user_role not null default 'WAREHOUSE WORKER',
  warehouse_ids text[] not null default '{}',   -- warehouses this user is assigned to
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Batches (inventory) and Movements (stock history)
-- ---------------------------------------------------------------------------
create table if not exists public.batches (
  id                  text primary key,
  crop                text not null,
  category            text not null,
  quantity            numeric not null,
  unit                text not null default 'kg',
  warehouse_id        text not null references public.warehouses (id),
  rack                text not null,
  storage_type        text not null default 'Ambient',
  notes               text,
  low_stock_threshold numeric not null default 100,
  stored_at           timestamptz not null default now(),   -- auto IST timestamp (stored UTC)
  created_by          uuid references auth.users (id),
  updated_at          timestamptz not null default now()
);

create table if not exists public.movements (
  id           uuid primary key default gen_random_uuid (),
  batch_id     text not null references public.batches (id) on delete cascade,
  crop         text not null,
  action       text not null,          -- ADD | SELL | TRANSFER | ADJUST | DISPOSE
  quantity     numeric not null,
  to_rack      text,
  warehouse_id text not null references public.warehouses (id),
  by_user      uuid references auth.users (id),
  at           timestamptz not null default now()
);

create index if not exists batches_warehouse_idx    on public.batches (warehouse_id);
create index if not exists movements_warehouse_idx  on public.movements (warehouse_id);
create index if not exists movements_batch_idx      on public.movements (batch_id);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer) — read the caller's scope without
-- triggering infinite recursion on profiles' own RLS policy.
-- ---------------------------------------------------------------------------
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_warehouse_ids()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(warehouse_ids, '{}'::text[])
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- The top role (MANAGER) — plus legacy 'ADMIN' rows — gets full privileges.
  select coalesce(public.auth_role() in ('MANAGER', 'ADMIN'), false);
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
alter table public.warehouses enable row level security;
alter table public.profiles   enable row level security;
alter table public.batches    enable row level security;
alter table public.movements  enable row level security;

-- Warehouses: a user sees the warehouses they are assigned to (managers see all).
drop policy if exists "warehouses readable by scope" on public.warehouses;
create policy "warehouses readable by scope"
  on public.warehouses for select
  using (public.is_admin() or id = any (public.auth_warehouse_ids()));

drop policy if exists "warehouses managed by admin" on public.warehouses;
create policy "warehouses managed by admin"
  on public.warehouses for all
  using (public.is_admin())
  with check (public.is_admin());

-- Profiles: you can always read/update your own profile; managers manage everyone.
drop policy if exists "profiles self readable" on public.profiles;
create policy "profiles self readable"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.auth_role());  -- never self-promote

drop policy if exists "profiles managed by admin" on public.profiles;
create policy "profiles managed by admin"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Batches: scoped to the user's assigned warehouses.
drop policy if exists "batches readable by scope" on public.batches;
create policy "batches readable by scope"
  on public.batches for select
  using (warehouse_id = any (public.auth_warehouse_ids()));

drop policy if exists "batches writable by scope" on public.batches;
create policy "batches writable by scope"
  on public.batches for insert
  with check (
    warehouse_id = any (public.auth_warehouse_ids())
    and (public.is_admin() or public.auth_role() in ('MANAGER', 'WAREHOUSE WORKER'))
  );

drop policy if exists "batches updatable by scope" on public.batches;
create policy "batches updatable by scope"
  on public.batches for update
  using (warehouse_id = any (public.auth_warehouse_ids()))
  with check (warehouse_id = any (public.auth_warehouse_ids()));

drop policy if exists "batches deletable by manager/admin" on public.batches;
create policy "batches deletable by manager/admin"
  on public.batches for delete
  using (
    warehouse_id = any (public.auth_warehouse_ids())
    and (public.is_admin() or public.auth_role() = 'MANAGER')
  );

-- Movements: same warehouse scope as batches.
drop policy if exists "movements readable by scope" on public.movements;
create policy "movements readable by scope"
  on public.movements for select
  using (warehouse_id = any (public.auth_warehouse_ids()));

drop policy if exists "movements writable by scope" on public.movements;
create policy "movements writable by scope"
  on public.movements for insert
  with check (
    warehouse_id = any (public.auth_warehouse_ids())
    and by_user = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Bootstrap a MANAGER (the top role): promote your own user after creating the
-- first account via the app signup, then assign the warehouses you need.
--   update public.profiles
--     set role = 'MANAGER',
--         warehouse_ids = array['warehouse-a','warehouse-b','warehouse-c']
--   where id = '<your auth uid>';
-- ---------------------------------------------------------------------------
