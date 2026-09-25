-- Additive commerce schema. No existing CRM records are altered or removed.
create table public.shop_products (
 slug text primary key,
 position integer not null default 0,
 data jsonb not null check (jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now()
);
create table public.shop_accounts (
 user_id uuid primary key references auth.users(id) on delete restrict,
 customer_id uuid unique references public.customers(id),
 created_at timestamptz not null default now()
);
create table public.shop_orders (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 request_id uuid not null,
 reference text not null unique,
 email text not null,
 address jsonb not null,
 subtotal_paise bigint not null check(subtotal_paise>0),
 shipping_paise bigint not null check(shipping_paise>=0),
 total_paise bigint not null check(total_paise=subtotal_paise+shipping_paise),
 payment_status text not null default 'pending' check(payment_status in ('pending','paid','failed','refunded','partially_refunded')),
 stage text not null default 'awaiting_payment' check(stage in ('awaiting_payment','awaiting_design','design_approved','production','ready_to_ship','shipped','delivered')),
 courier text not null,
 parcel jsonb not null,
 refunded_paise bigint not null default 0 check(refunded_paise>=0 and refunded_paise<=total_paise),
 created_at timestamptz not null default now(),
 unique(user_id,request_id)
);
create index shop_orders_user_date on public.shop_orders(user_id,created_at desc);
create index shop_orders_stage_date on public.shop_orders(stage,created_at desc);
create table public.shop_assets (
 id uuid primary key,
 user_id uuid not null references auth.users(id),
 path text not null unique,
 name text not null,
 verified boolean not null default false,
 created_at timestamptz not null default now()
);
create index shop_assets_user on public.shop_assets(user_id);
create table public.shop_order_items (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.shop_orders(id) on delete restrict,
 product_slug text not null,
 variant_id text not null,
 name text not null,
 variant_name text not null,
 image text not null,
 quantity integer not null check(quantity between 1 and 50),
 price_paise bigint not null check(price_paise>0),
 asset_id uuid references public.shop_assets(id)
);
create index shop_order_items_order on public.shop_order_items(order_id);
create index shop_order_items_asset on public.shop_order_items(asset_id);
create table public.shop_payments (
 order_id uuid primary key references public.shop_orders(id),
 txnid text not null unique,
 provider_id text unique,
 status text not null default 'pending',
 updated_at timestamptz not null default now()
);
create table public.shop_fulfilments (
 order_id uuid primary key references public.shop_orders(id),
 booking_status text not null default 'booking' check(booking_status in ('booking','booked','review')),
 awb text unique,
 label_url text,
 tracking jsonb,
 checked_at timestamptz,
 error text,
 created_at timestamptz not null default now()
);
create table public.shop_order_events (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.shop_orders(id),
 label text not null,
 created_at timestamptz not null default now()
);
create index shop_order_events_order on public.shop_order_events(order_id,created_at);
alter table public.transactions add column shop_order_id uuid references public.shop_orders(id);
alter table public.transactions add column commerce_reference text unique;
create index transactions_shop_order on public.transactions(shop_order_id);

alter table public.shop_products enable row level security;
alter table public.shop_accounts enable row level security;
alter table public.shop_orders enable row level security;
alter table public.shop_assets enable row level security;
alter table public.shop_order_items enable row level security;
alter table public.shop_payments enable row level security;
alter table public.shop_fulfilments enable row level security;
alter table public.shop_order_events enable row level security;
revoke all on public.shop_products,public.shop_accounts,public.shop_orders,public.shop_assets,public.shop_order_items,public.shop_payments,public.shop_fulfilments,public.shop_order_events from anon,authenticated;
grant all on public.shop_products,public.shop_accounts,public.shop_orders,public.shop_assets,public.shop_order_items,public.shop_payments,public.shop_fulfilments,public.shop_order_events to service_role;
grant select on public.shop_products to anon,authenticated;
create policy catalogue_read on public.shop_products for select to anon,authenticated using ((data->>'active')::boolean=true);
grant select on public.shop_orders,public.shop_order_items,public.shop_order_events,public.shop_assets to authenticated;
create policy buyer_orders on public.shop_orders for select to authenticated using (user_id=(select auth.uid()));
create policy buyer_items on public.shop_order_items for select to authenticated using (exists(select 1 from public.shop_orders o where o.id=order_id and o.user_id=(select auth.uid())));
create policy buyer_events on public.shop_order_events for select to authenticated using (exists(select 1 from public.shop_orders o where o.id=order_id and o.user_id=(select auth.uid())));
create policy buyer_assets on public.shop_assets for select to authenticated using (user_id=(select auth.uid()));
-- No client writes to pricing, payment, fulfilment or assets. Authenticated server code owns writes.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('order-logos','order-logos',false,10485760,array['image/png'])
 on conflict(id) do nothing;

create or replace function public.shop_create_order(payload jsonb, items jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare oid uuid; item jsonb; asset_owner uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(payload->>'user_id',0));
 select id into oid from public.shop_orders where user_id=(payload->>'user_id')::uuid and request_id=(payload->>'request_id')::uuid;
 if oid is not null then return oid; end if;
 if (select count(*) from public.shop_orders where user_id=(payload->>'user_id')::uuid and created_at>now()-interval '1 hour')>=10 then raise exception 'Please wait before creating another order'; end if;
 insert into public.shop_orders(user_id,request_id,reference,email,address,subtotal_paise,shipping_paise,total_paise,courier,parcel)
 values((payload->>'user_id')::uuid,(payload->>'request_id')::uuid,payload->>'reference',payload->>'email',payload->'address',(payload->>'subtotal_paise')::bigint,(payload->>'shipping_paise')::bigint,(payload->>'total_paise')::bigint,payload->>'courier',payload->'parcel') returning id into oid;
 for item in select * from jsonb_array_elements(items) loop
  if item->>'asset_id' is not null then
   select user_id into asset_owner from public.shop_assets where id=(item->>'asset_id')::uuid and verified=true;
   if asset_owner is distinct from (payload->>'user_id')::uuid then raise exception 'Invalid logo ownership'; end if;
  end if;
  insert into public.shop_order_items(order_id,product_slug,variant_id,name,variant_name,image,quantity,price_paise,asset_id)
  values(oid,item->>'product_slug',item->>'variant_id',item->>'name',item->>'variant_name',item->>'image',(item->>'quantity')::int,(item->>'price_paise')::bigint,(item->>'asset_id')::uuid);
 end loop;
 if (select sum(quantity*price_paise) from public.shop_order_items where order_id=oid) is distinct from (payload->>'subtotal_paise')::bigint then raise exception 'Incorrect subtotal'; end if;
 insert into public.shop_payments(order_id,txnid) values(oid,replace(oid::text,'-',''));
 insert into public.shop_order_events(order_id,label) values(oid,'Awaiting payment');
 return oid;
end $$;
revoke all on function public.shop_create_order(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.shop_create_order(jsonb,jsonb) to service_role;

create or replace function public.shop_confirm_payment(p_txnid text,p_provider_id text,p_amount bigint)
returns uuid language plpgsql security invoker set search_path='' as $$
declare o public.shop_orders; cid uuid;
begin
 select so.* into o from public.shop_orders so join public.shop_payments sp on sp.order_id=so.id where sp.txnid=p_txnid for update of so;
 if o.id is null or o.total_paise<>p_amount then raise exception 'Payment does not match order'; end if;
 if o.payment_status in ('paid','refunded','partially_refunded') then return o.id; end if;
 perform pg_advisory_xact_lock(hashtextextended(o.user_id::text,0));
 select customer_id into cid from public.shop_accounts where user_id=o.user_id;
 if cid is null then
  insert into public.customers(name,business_name,phone,email,city,notes)
  values(o.address->>'name',o.address->>'name',o.address->>'phone',o.email,o.address->>'city','Online shop customer') returning id into cid;
  insert into public.shop_accounts(user_id,customer_id) values(o.user_id,cid);
 end if;
 update public.shop_payments set status='paid',provider_id=p_provider_id,updated_at=now() where order_id=o.id;
 update public.shop_orders set payment_status='paid',stage='awaiting_design' where id=o.id;
 insert into public.transactions(type,category,amount_paise,payment_mode,occurred_on,customer_id,notes,shop_order_id,commerce_reference)
 values('income','online_order',o.total_paise,'other',current_date,cid,'PayU payment including shipping: '||o.reference,o.id,'payu:'||p_txnid);
 insert into public.shop_order_events(order_id,label) values(o.id,'Payment confirmed. Awaiting design confirmation on WhatsApp.');
 return o.id;
end $$;
revoke all on function public.shop_confirm_payment(text,text,bigint) from public,anon,authenticated;
grant execute on function public.shop_confirm_payment(text,text,bigint) to service_role;

create or replace function public.shop_advance_order(p_id uuid,p_stage text)
returns void language plpgsql security invoker set search_path='' as $$
declare o public.shop_orders; expected text;
begin
 select * into o from public.shop_orders where id=p_id for update;
 if o.payment_status<>'paid' then raise exception 'Order must be paid'; end if;
 expected:=case o.stage when 'awaiting_design' then 'design_approved' when 'design_approved' then 'production' when 'production' then 'ready_to_ship' else null end;
 if expected is null or p_stage<>expected then raise exception 'Invalid fulfilment transition'; end if;
 update public.shop_orders set stage=p_stage where id=p_id;
 insert into public.shop_order_events(order_id,label) values(p_id,replace(p_stage,'_',' '));
end $$;
revoke all on function public.shop_advance_order(uuid,text) from public,anon,authenticated;
grant execute on function public.shop_advance_order(uuid,text) to service_role;

create or replace function public.shop_record_expense(p_id uuid,p_amount bigint,p_reference text,p_category text)
returns void language plpgsql security invoker set search_path='' as $$
declare o public.shop_orders; cid uuid;
begin
 select * into o from public.shop_orders where id=p_id for update;
 if exists(select 1 from public.transactions where commerce_reference=p_reference) then
  if not exists(select 1 from public.transactions where commerce_reference=p_reference and shop_order_id=p_id and amount_paise=p_amount and category=p_category) then raise exception 'Reference already used for a different expense'; end if;
  return;
 end if;
 if p_amount<=0 or p_category not in ('order_refund','order_shipping') or o.payment_status not in ('paid','partially_refunded','refunded') then raise exception 'Invalid expense'; end if;
 select customer_id into cid from public.shop_accounts where user_id=o.user_id;
 if p_category='order_refund' then
  if o.refunded_paise+p_amount>o.total_paise then raise exception 'Refund exceeds amount collected'; end if;
  update public.shop_orders set refunded_paise=refunded_paise+p_amount,payment_status=case when refunded_paise+p_amount=total_paise then 'refunded' else 'partially_refunded' end where id=p_id;
 end if;
 insert into public.transactions(type,category,amount_paise,payment_mode,occurred_on,customer_id,notes,shop_order_id,commerce_reference)
 values('expense',p_category,p_amount,'other',current_date,cid,'Recorded actual expense: '||o.reference,p_id,p_reference);
end $$;
revoke all on function public.shop_record_expense(uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function public.shop_record_expense(uuid,bigint,text,text) to service_role;
