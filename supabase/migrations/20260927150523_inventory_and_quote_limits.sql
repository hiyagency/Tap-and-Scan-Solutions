alter table public.shop_products add column stock integer not null default 0 check(stock>=0);
-- Ten units per product, shared across variants.
update public.shop_products set stock=10;
alter table public.shop_order_items add column stock_reserved boolean not null default false;
create function private.reserve_shop_stock() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 update public.shop_products set stock=stock-new.quantity,updated_at=now() where slug=new.product_slug and stock>=new.quantity;
 if not found then raise exception 'Insufficient stock'; end if;
 new.stock_reserved:=true; return new;
end $$;
create trigger reserve_shop_stock before insert on public.shop_order_items for each row execute function private.reserve_shop_stock();
-- Paid returns require owner inspection, not automatic restocking.
create function private.release_shop_stock() returns trigger language plpgsql security definer set search_path='' as $$
declare item record;
begin
 if new.payment_status in ('pending','failed') and (new.payment_status='failed' or new.cancelled_at is not null) then
  for item in select id,product_slug,quantity from public.shop_order_items where order_id=new.id and stock_reserved for update loop
   update public.shop_products set stock=stock+item.quantity,updated_at=now() where slug=item.product_slug;
   update public.shop_order_items set stock_reserved=false where id=item.id;
  end loop;
 elsif new.payment_status='paid' and old.payment_status<>'paid' then
  for item in select id,product_slug,quantity from public.shop_order_items where order_id=new.id and not stock_reserved for update loop
   update public.shop_products set stock=stock-item.quantity,updated_at=now() where slug=item.product_slug and stock>=item.quantity;
   if not found then raise exception 'Payment needs inventory reconciliation'; end if;
   update public.shop_order_items set stock_reserved=true where id=item.id;
  end loop;
 end if;
 return new;
end $$;
revoke all on function private.release_shop_stock() from public,anon,authenticated;
create trigger release_shop_stock after update of payment_status,cancelled_at on public.shop_orders for each row execute function private.release_shop_stock();
create table public.shop_quote_limits(fingerprint text primary key,started_at timestamptz not null default now(),requests integer not null default 1);
alter table public.shop_quote_limits enable row level security;
revoke all on public.shop_quote_limits from public,anon,authenticated;
grant all on public.shop_quote_limits to service_role;
create function public.shop_allow_quote(p_fingerprint text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 delete from public.shop_quote_limits where started_at<now()-interval '1 day';
 insert into public.shop_quote_limits(fingerprint) values(p_fingerprint) on conflict(fingerprint) do update
 set requests=case when shop_quote_limits.started_at<now()-interval '10 minutes' then 1 else shop_quote_limits.requests+1 end,
 started_at=case when shop_quote_limits.started_at<now()-interval '10 minutes' then now() else shop_quote_limits.started_at end returning requests into n;
 return n<=20;
end $$;
revoke all on function public.shop_allow_quote(text) from public,anon,authenticated;
grant execute on function public.shop_allow_quote(text) to service_role;
update public.shop_products set data=jsonb_set(data,'{packedWeightGrams}','250'::jsonb) where data->>'kind'='keychain';
