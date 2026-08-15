create extension if not exists pgcrypto;

create type public.app_role as enum ('owner');
create type public.lead_source as enum ('website', 'manual', 'referral', 'instagram', 'phone');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost');
create type public.customer_status as enum ('active', 'inactive', 'archived');
create type public.billing_model as enum ('one_time', 'monthly');
create type public.service_status as enum ('active', 'paused', 'completed');
create type public.transaction_type as enum ('income', 'expense');
create type public.payment_mode as enum ('cash', 'upi', 'bank_transfer', 'card', 'other');
create type public.due_status as enum ('pending', 'partial', 'paid', 'overdue', 'cancelled');

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.app_role not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  source public.lead_source not null default 'manual',
  status public.lead_status not null default 'new',
  name text not null,
  business_name text not null,
  phone text not null,
  email text,
  city text,
  business_type text,
  interests text[] not null default '{}',
  quantity text,
  timeline text,
  message text,
  notes text,
  consent_at timestamptz,
  submission_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  source_lead_id uuid unique references public.leads(id) on delete set null,
  status public.customer_status not null default 'active',
  name text not null,
  business_name text not null,
  phone text not null,
  email text,
  city text,
  onboarding_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_services (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_name text not null,
  billing_model public.billing_model not null,
  agreed_amount_paise bigint not null default 0 check (agreed_amount_paise >= 0),
  renewal_date date,
  status public.service_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dues (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  reference text not null,
  amount_paise bigint not null check (amount_paise > 0),
  paid_amount_paise bigint not null default 0 check (paid_amount_paise >= 0 and paid_amount_paise <= amount_paise),
  issue_date date not null default current_date,
  due_date date not null,
  status public.due_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, reference)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  type public.transaction_type not null,
  category text not null,
  amount_paise bigint not null check (amount_paise > 0),
  payment_mode public.payment_mode not null,
  occurred_on date not null default current_date,
  customer_id uuid references public.customers(id) on delete set null,
  due_id uuid references public.dues(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_status_created_idx on public.leads (status, created_at desc);
create index leads_fingerprint_created_idx on public.leads (submission_fingerprint, created_at desc) where submission_fingerprint is not null;
create index customers_status_idx on public.customers (status);
create index customer_services_renewal_idx on public.customer_services (renewal_date) where billing_model = 'monthly';
create index dues_status_date_idx on public.dues (status, due_date);
create index transactions_date_type_idx on public.transactions (occurred_on desc, type);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger leads_set_updated_at before update on public.leads for each row execute function private.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function private.set_updated_at();
create trigger customer_services_set_updated_at before update on public.customer_services for each row execute function private.set_updated_at();
create trigger dues_set_updated_at before update on public.dues for each row execute function private.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions for each row execute function private.set_updated_at();

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'owner'
  );
$$;

revoke all on function private.is_owner() from public, anon;
grant execute on function private.is_owner() to authenticated;

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.customers enable row level security;
alter table public.customer_services enable row level security;
alter table public.dues enable row level security;
alter table public.transactions enable row level security;

create policy "owner can view own profile" on public.profiles for select to authenticated using (id = (select auth.uid()) and role = 'owner');

create policy "owner can select leads" on public.leads for select to authenticated using ((select private.is_owner()));
create policy "owner can insert leads" on public.leads for insert to authenticated with check ((select private.is_owner()));
create policy "owner can update leads" on public.leads for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner can delete leads" on public.leads for delete to authenticated using ((select private.is_owner()));

create policy "owner can select customers" on public.customers for select to authenticated using ((select private.is_owner()));
create policy "owner can insert customers" on public.customers for insert to authenticated with check ((select private.is_owner()));
create policy "owner can update customers" on public.customers for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner can delete customers" on public.customers for delete to authenticated using ((select private.is_owner()));

create policy "owner can select services" on public.customer_services for select to authenticated using ((select private.is_owner()));
create policy "owner can insert services" on public.customer_services for insert to authenticated with check ((select private.is_owner()));
create policy "owner can update services" on public.customer_services for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner can delete services" on public.customer_services for delete to authenticated using ((select private.is_owner()));

create policy "owner can select dues" on public.dues for select to authenticated using ((select private.is_owner()));
create policy "owner can insert dues" on public.dues for insert to authenticated with check ((select private.is_owner()));
create policy "owner can update dues" on public.dues for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner can delete dues" on public.dues for delete to authenticated using ((select private.is_owner()));

create policy "owner can select transactions" on public.transactions for select to authenticated using ((select private.is_owner()));
create policy "owner can insert transactions" on public.transactions for insert to authenticated with check ((select private.is_owner()));
create policy "owner can update transactions" on public.transactions for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "owner can delete transactions" on public.transactions for delete to authenticated using ((select private.is_owner()));

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.leads, public.customers, public.customer_services, public.dues, public.transactions to authenticated;
revoke all on public.profiles, public.leads, public.customers, public.customer_services, public.dues, public.transactions from anon;

create or replace function public.record_due_payment(
  p_due_id uuid,
  p_amount_paise bigint,
  p_payment_mode public.payment_mode,
  p_occurred_on date default current_date,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_due public.dues%rowtype;
  transaction_id uuid;
  new_paid_amount bigint;
begin
  if p_amount_paise <= 0 then raise exception 'Payment amount must be positive'; end if;

  select * into target_due from public.dues where id = p_due_id for update;
  if not found then raise exception 'Due not found'; end if;
  if target_due.status in ('paid', 'cancelled') then raise exception 'Due is not payable'; end if;

  new_paid_amount := target_due.paid_amount_paise + p_amount_paise;
  if new_paid_amount > target_due.amount_paise then raise exception 'Payment exceeds outstanding balance'; end if;

  insert into public.transactions (type, category, amount_paise, payment_mode, occurred_on, customer_id, due_id, notes)
  values ('income', 'customer_payment', p_amount_paise, p_payment_mode, p_occurred_on, target_due.customer_id, target_due.id, p_notes)
  returning id into transaction_id;

  update public.dues
  set paid_amount_paise = new_paid_amount,
      status = case when new_paid_amount = amount_paise then 'paid'::public.due_status else 'partial'::public.due_status end
  where id = target_due.id;

  return transaction_id;
end;
$$;

revoke all on function public.record_due_payment(uuid, bigint, public.payment_mode, date, text) from public, anon;
grant execute on function public.record_due_payment(uuid, bigint, public.payment_mode, date, text) to authenticated;
