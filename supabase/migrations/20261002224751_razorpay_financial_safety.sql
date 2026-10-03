-- Canonical product locks avoid opposite-cart A/B versus B/A deadlocks. Keep
-- provider calls outside transactions, and keep collected cash independent of fulfilment.
create or replace function public.shop_create_razorpay_order(payload jsonb,items jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare oid uuid; fingerprint text:=payload->>'checkout_fingerprint'; existing public.shop_orders; ordered_items jsonb;
begin
 if fingerprint is null or fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'Invalid checkout fingerprint'; end if;
 perform pg_advisory_xact_lock(hashtextextended(payload->>'user_id',0));
 select * into existing from public.shop_orders where user_id=(payload->>'user_id')::uuid and request_id=(payload->>'request_id')::uuid;
 if existing.id is not null then
  if existing.checkout_fingerprint is distinct from fingerprint
   or not exists(select 1 from public.shop_payments where order_id=existing.id and provider='razorpay') then raise exception 'Order changed; begin a new checkout'; end if;
  return existing.id;
 end if;
 perform 1 from public.shop_products where slug in (select i->>'product_slug' from jsonb_array_elements(items) i) order by slug for update;
 select jsonb_agg(i order by i->>'product_slug',i->>'variant_id',coalesce(i->>'asset_id','')) into ordered_items from jsonb_array_elements(items) i;
 oid:=public.shop_create_order(payload,ordered_items);
 update public.shop_orders set checkout_fingerprint=fingerprint where id=oid;
 update public.shop_payments set provider='razorpay' where order_id=oid;
 return oid;
end $$;

-- This existing privileged trigger is needed for authenticated owner cancellation;
-- it remains private/revoked. Canonically lock product rows before item rows.
create or replace function private.release_shop_stock() returns trigger language plpgsql security definer set search_path='' as $$
declare item record;
begin
 if new.payment_status in ('pending','failed') and (new.payment_status='failed' or new.cancelled_at is not null) then
  perform 1 from public.shop_products where slug in (select product_slug from public.shop_order_items where order_id=new.id and stock_reserved) order by slug for update;
  for item in select id,product_slug,quantity from public.shop_order_items where order_id=new.id and stock_reserved order by product_slug,id for update loop
   update public.shop_products set stock=stock+item.quantity,updated_at=now() where slug=item.product_slug;
   update public.shop_order_items set stock_reserved=false where id=item.id;
  end loop;
 elsif new.payment_status='paid' and old.payment_status<>'paid' then
  -- A cancelled order is not fulfilled, but a captured payment must still be
  -- recorded even when its released stock has been sold to another purchaser.
  if new.cancelled_at is not null then return new; end if;
  perform 1 from public.shop_products where slug in (select product_slug from public.shop_order_items where order_id=new.id and not stock_reserved) order by slug for update;
  for item in select id,product_slug,quantity from public.shop_order_items where order_id=new.id and not stock_reserved order by product_slug,id for update loop
   update public.shop_products set stock=stock-item.quantity,updated_at=now() where slug=item.product_slug and stock>=item.quantity;
   if not found then raise exception 'Payment needs inventory reconciliation'; end if;
   update public.shop_order_items set stock_reserved=true where id=item.id;
  end loop;
 end if;
 return new;
end $$;
revoke all on function private.release_shop_stock() from public,anon,authenticated;

create or replace function public.shop_confirm_razorpay_payment(p_id uuid,p_provider_order text,p_provider_payment text,p_amount bigint,p_event_id text default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare o public.shop_orders; p public.shop_payments; cid uuid; buyer uuid; prior_event uuid; needs_inventory boolean;
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
 -- Rare delayed capture after a failed payment can also have released stock.
 -- Record the money, but cancel/block fulfilment if it can no longer be reserved.
 if o.cancelled_at is null then
  perform 1 from public.shop_products where slug in (select product_slug from public.shop_order_items where order_id=p_id and not stock_reserved) order by slug for update;
  select exists(select 1 from
   (select product_slug,sum(quantity) as needed from public.shop_order_items where order_id=p_id and not stock_reserved group by product_slug) requested
   left join public.shop_products product on product.slug=requested.product_slug where coalesce(product.stock,0)<requested.needed)
   into needs_inventory;
  if needs_inventory then
   update public.shop_orders set cancelled_at=now(),cancellation_reason='Captured payment requires inventory reconciliation or refund. Do not fulfil.' where id=p_id;
   select * into o from public.shop_orders where id=p_id;
  end if;
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
 values(o.id,'payment',case when o.cancelled_at is not null then 'Payment captured for a cancelled order. Fulfilment is blocked; contact support for reconciliation or refund.'
  else 'Payment confirmed. Awaiting design confirmation on WhatsApp.' end,jsonb_build_object('provider','razorpay','fulfilment_blocked',o.cancelled_at is not null));
 return o.id;
end $$;
-- CREATE OR REPLACE retains earlier privileges, but repeat least-privilege grants.
revoke all on function public.shop_create_razorpay_order(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.shop_confirm_razorpay_payment(uuid,text,text,bigint,text) from public,anon,authenticated;
grant execute on function public.shop_create_razorpay_order(jsonb,jsonb) to service_role;
grant execute on function public.shop_confirm_razorpay_payment(uuid,text,text,bigint,text) to service_role;
