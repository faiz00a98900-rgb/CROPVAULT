-- CropVault — shared alert resolution state
-- ============================================================================
-- Previously "Resolved / In Review" alert marks lived only in each browser's
-- localStorage, so a manager resolving an alert never reached a worker. This
-- table makes alert state shared (RLS-scoped per warehouse), exactly like the
-- batches table.
--
-- Apply with:  supabase db push    (or paste this whole file into the
--              Supabase SQL editor and run it once)
-- ============================================================================

create table if not exists public.alert_states (
  id           text primary key,                       -- '<batchId>:<AlertType>'
  state        text not null,                          -- Open | In Review | Resolved
  warehouse_id text not null references public.warehouses (id) on delete cascade,
  updated_by   uuid references auth.users (id),
  updated_at   timestamptz not null default now()
);

create index if not exists alert_states_warehouse_idx on public.alert_states (warehouse_id);

alter table public.alert_states enable row level security;

-- Anyone in the warehouse scope can READ resolution state, so workers see a
-- manager's "Resolved" mark. Only managers (is_admin) may write it — matching
-- the UI, where resolve/approve buttons are gated by approve_actions.
drop policy if exists "alert_states readable by scope" on public.alert_states;
create policy "alert_states readable by scope"
  on public.alert_states for select
  using (warehouse_id = any (public.auth_warehouse_ids()));

drop policy if exists "alert_states writable by manager" on public.alert_states;
create policy "alert_states writable by manager"
  on public.alert_states for all
  using (public.is_admin() and warehouse_id = any (public.auth_warehouse_ids()))
  with check (public.is_admin() and warehouse_id = any (public.auth_warehouse_ids()));

-- ---------------------------------------------------------------------------
-- IMPORTANT — redeploy the MANAGER-aware is_admin().
-- If an existing project still has the OLD is_admin() (which only matched the
-- legacy 'ADMIN' role), then every policy that relies on it silently rejects
-- managers — this breaks alert resolution writes AND manager user-management.
-- Redefining it here makes this migration safe (and necessary) to re-run.
-- ---------------------------------------------------------------------------
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
