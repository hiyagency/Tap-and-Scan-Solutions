-- Add Razorpay without changing historical PayU payments, CRM amounts or stock.
alter table public.shop_payments add column provider text not null default 'payu'
 check(provider in ('payu','razorpay'));
alter table public.shop_payments add column razorpay_order_id text unique
 check(razorpay_order_id is null or razorpay_order_id ~ '^order_[A-Za-z0-9]+$');
alter table public.shop_orders add column checkout_fingerprint text
 check(checkout_fingerprint is null or checkout_fingerprint ~ '^[a-f0-9]{64}$');
create table public.shop_payment_events (
 event_id text primary key check(length(event_id) between 1 and 200),
 order_id uuid not null references public.shop_orders(id),
 provider text not null check(provider='razorpay'),
 processed_at timestamptz not null default now()
);
create index shop_payment_events_order on public.shop_payment_events(order_id);
alter table public.shop_payment_events enable row level security;
revoke all on public.shop_payment_events from public,anon,authenticated;
grant select,insert on public.shop_payment_events to service_role;

-- Reuse atomic tax/items/logo ownership/stock reservation. Retries cannot switch a
-- historical PayU attempt to another provider.
create function public.shop_create_razorpay_order(payload jsonb,items jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare oid uuid; fingerprint text:=payload->>'checkout_fingerprint'; existing public.shop_orders;
begin
 if fingerprint is null or fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'Invalid checkout fingerprint'; end if;
 perform pg_advisory_xact_lock(hashtextextended(payload->>'user_id',0));
 select * into existing from public.shop_orders where user_id=(payload->>'user_id')::uuid and request_id=(payload->>'request_id')::uuid;
 if existing.id is not null then
  if existing.checkout_fingerprint is distinct from fingerprint
   or not exists(select 1 from public.shop_payments where order_id=existing.id and provider='razorpay') then
   raise exception 'Order changed; begin a new checkout';
  end if;
  return existing.id;
 end if;
 oid:=public.shop_create_order(payload,items);
 update public.shop_orders set checkout_fingerprint=fingerprint where id=oid;
 update public.shop_payments set provider='razorpay' where order_id=oid;
 return oid;
end $$;

-- Provider calls happen outside transactions. A short claim prevents parallel
-- creates; uncertain transport results recover by the unique provider receipt.
create function public.shop_claim_razorpay_payment(p_id uuid,p_user uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.shop_orders; p public.shop_payments; action text;
begin
 select * into o from public.shop_orders where id=p_id for update;
 if o.id is null or p_user is null or o.user_id<>p_user or o.cancelled_at is not null or o.payment_status<>'pending' then raise exception 'Order is not payable'; end if;
 select * into p from public.shop_payments where order_id=p_id for update;
 if p.provider is distinct from 'razorpay' then raise exception 'Payment provider mismatch'; end if;
 if p.razorpay_order_id is not null then return jsonb_build_object('action','reuse','razorpay_order_id',p.razorpay_order_id); end if;
 if p.status in ('creating','recovering') and p.updated_at>now()-interval '60 seconds' then return jsonb_build_object('action','busy'); end if;
 action:=case when p.status in ('creating','recovering','review') then 'recover' else 'create' end;
 update public.shop_payments set status=case when action='recover' then 'recovering' else 'creating' end,updated_at=now() where order_id=p_id;
 return jsonb_build_object('action',action);
end $$;

create function public.shop_attach_razorpay_order(p_id uuid,p_provider_order text,p_amount bigint)
returns void language plpgsql security invoker set search_path='' as $$
declare o public.shop_orders; p public.shop_payments;
begin
 select * into o from public.shop_orders where id=p_id for update;
 select * into p from public.shop_payments where order_id=p_id for update;
 if o.id is null or p_amount is null or o.total_paise<>p_amount or o.payment_status<>'pending' or o.cancelled_at is not null
  or p.provider is distinct from 'razorpay' or p_provider_order is null or p_provider_order !~ '^order_[A-Za-z0-9]+$' then raise exception 'Provider order mismatch'; end if;
 if p.razorpay_order_id is not null and p.razorpay_order_id<>p_provider_order then raise exception 'Provider order already linked'; end if;
 update public.shop_payments set razorpay_order_id=p_provider_order,status='ready',updated_at=now() where order_id=p_id;
end $$;

-- Only called after fetching a captured payment and checking exact INR amount,
-- stored provider order and customer ownership/signature in server code.
create function public.shop_confirm_razorpay_payment(p_id uuid,p_provider_order text,p_provider_payment text,p_amount bigint,p_event_id text default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare o public.shop_orders; p public.shop_payments; cid uuid; buyer uuid; prior_event uuid;
begin
 select user_id into buyer from public.shop_orders where id=p_id;
 if buyer is null then raise exception 'Order not found'; end if;
 perform pg_advisory_xact_lock(hashtextextended(buyer::text,0));
 select * into o from public.shop_orders where id=p_id for update;
 select * into p from public.shop_payments where order_id=p_id for update;
 if p_amount is null or o.total_paise<>p_amount or p.provider is distinct from 'razorpay' or p.razorpay_order_id is null
  or p_provider_order is null or p.razorpay_order_id is distinct from p_provider_order
  or p_provider_payment is null or p_provider_payment !~ '^pay_[A-Za-z0-9]+$' then raise exception 'Payment does not match order'; end if;
 if p_event_id is not null then
  insert into public.shop_payment_events(event_id,order_id,provider) values(p_event_id,p_id,'razorpay') on conflict(event_id) do nothing;
  select order_id into prior_event from public.shop_payment_events where event_id=p_event_id;
  if prior_event is distinct from p_id then raise exception 'Payment event already belongs to another order'; end if;
 end if;
 if o.payment_status in ('paid','partially_refunded','refunded') then
  if p.provider_id is distinct from p_provider_payment then raise exception 'Another captured payment needs reconciliation'; end if;
  return o.id;
 end if;
 select customer_id into cid from public.shop_accounts where user_id=o.user_id;
 if cid is null then
  insert into public.customers(name,business_name,phone,email,city,notes)
  values(o.address->>'name',o.address->>'name',o.address->>'phone',o.email,o.address->>'city','Online shop customer') returning id into cid;
  insert into public.shop_accounts(user_id,customer_id) values(o.user_id,cid);
 end if;
 update public.shop_payments set status='paid',provider_id=p_provider_payment,updated_at=now() where order_id=o.id;
 update public.shop_orders set payment_status='paid',stage='awaiting_design' where id=o.id;
 insert into public.transactions(type,category,amount_paise,payment_mode,occurred_on,customer_id,notes,shop_order_id,commerce_reference)
 values('income','online_order',o.total_paise,'other',current_date,cid,'Razorpay payment including tax and shipping: '||o.reference,o.id,'razorpay:'||p_provider_payment);
 insert into public.shop_order_events(order_id,event_type,label,metadata)
 values(o.id,'payment','Payment confirmed. Awaiting design confirmation on WhatsApp.',jsonb_build_object('provider','razorpay'));
 return o.id;
end $$;

revoke all on function public.shop_create_razorpay_order(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.shop_claim_razorpay_payment(uuid,uuid) from public,anon,authenticated;
revoke all on function public.shop_attach_razorpay_order(uuid,text,bigint) from public,anon,authenticated;
revoke all on function public.shop_confirm_razorpay_payment(uuid,text,text,bigint,text) from public,anon,authenticated;
grant execute on function public.shop_create_razorpay_order(jsonb,jsonb) to service_role;
grant execute on function public.shop_claim_razorpay_payment(uuid,uuid) to service_role;
grant execute on function public.shop_attach_razorpay_order(uuid,text,bigint) to service_role;
grant execute on function public.shop_confirm_razorpay_payment(uuid,text,text,bigint,text) to service_role;
