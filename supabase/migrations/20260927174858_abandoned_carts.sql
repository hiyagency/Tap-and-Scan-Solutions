create table public.shop_abandoned_carts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (length(name) between 2 and 100),
 phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
 email text not null,
 items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 20),
 consent_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 status text not null default 'open' check (status in ('open','contacted','closed'))
);
alter table public.shop_abandoned_carts enable row level security;
revoke all on public.shop_abandoned_carts from anon, authenticated;
grant all on public.shop_abandoned_carts to service_role;
create index shop_abandoned_carts_updated_idx on public.shop_abandoned_carts(updated_at);

-- Payment callbacks remove only snapshots older than the paid order.
create function private.clear_paid_cart() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.payment_status = 'paid' then
  delete from public.shop_abandoned_carts where user_id = new.user_id and updated_at <= new.created_at;
 end if;
 return new;
end $$;
revoke all on function private.clear_paid_cart() from public, anon, authenticated;
create trigger clear_paid_cart after update of payment_status on public.shop_orders
for each row execute function private.clear_paid_cart();
