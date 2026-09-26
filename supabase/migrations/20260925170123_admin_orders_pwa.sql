-- Extend existing commerce records. No data deletion, renames or payment changes.
alter table public.shop_orders add column if not exists updated_at timestamptz not null default now();
alter table public.shop_orders add column if not exists received_at timestamptz;
alter table public.shop_orders add column if not exists cancelled_at timestamptz;
alter table public.shop_orders add column if not exists cancellation_reason text;
alter table public.shop_order_events add column if not exists event_type text not null default 'order_update';
alter table public.shop_order_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.shop_order_events add column if not exists created_by uuid references auth.users(id);

create table if not exists public.shop_admin_order_state (
 order_id uuid primary key references public.shop_orders(id),
 read_at timestamptz,
 notes text not null default '' check(length(notes)<=5000),
 updated_at timestamptz not null default now()
);
create table if not exists public.push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 endpoint text not null unique,
 p256dh text not null,
 auth text not null,
 device_name text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.shop_admin_order_state enable row level security;
alter table public.push_subscriptions enable row level security;
revoke all on public.shop_admin_order_state,public.push_subscriptions from anon,authenticated;
grant all on public.shop_admin_order_state,public.push_subscriptions to service_role;
grant select,insert,update on public.shop_admin_order_state to authenticated;
grant select,insert,update,delete on public.push_subscriptions to authenticated;
create policy owner_order_state on public.shop_admin_order_state for all to authenticated
 using ((select private.is_owner())) with check ((select private.is_owner()));
create policy owner_push_devices on public.push_subscriptions for all to authenticated
 using (user_id=(select auth.uid()) and (select private.is_owner()))
 with check (user_id=(select auth.uid()) and (select private.is_owner()));
create index if not exists push_subscriptions_user on public.push_subscriptions(user_id);
create index if not exists shop_orders_date on public.shop_orders(created_at desc,id desc);
create index if not exists shop_orders_payment_date on public.shop_orders(payment_status,created_at desc);
create index if not exists shop_orders_received on public.shop_orders(received_at desc) where received_at is not null;

-- Keep purchaser policies. Add owner access using the EXISTING profiles.role='owner'.
grant select on public.shop_accounts,public.shop_payments,public.shop_fulfilments to authenticated;
create policy owner_orders_read on public.shop_orders for select to authenticated using ((select private.is_owner()));
create policy owner_items_read on public.shop_order_items for select to authenticated using ((select private.is_owner()));
create policy owner_events_read on public.shop_order_events for select to authenticated using ((select private.is_owner()));
create policy owner_accounts_read on public.shop_accounts for select to authenticated using ((select private.is_owner()));
create policy owner_payments_read on public.shop_payments for select to authenticated using ((select private.is_owner()));
create policy owner_fulfilments_read on public.shop_fulfilments for select to authenticated using ((select private.is_owner()));
grant update(stage,cancelled_at,cancellation_reason) on public.shop_orders to authenticated;
create policy owner_orders_update on public.shop_orders for update to authenticated
 using ((select private.is_owner())) with check ((select private.is_owner()));
grant insert on public.shop_order_events to authenticated;
create policy owner_events_insert on public.shop_order_events for insert to authenticated
 with check ((select private.is_owner()) and created_by=(select auth.uid()));

create or replace function public.admin_order_stamp() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 new.updated_at:=now();
 if new.payment_status='paid' and old.payment_status not in ('paid','partially_refunded','refunded') then
  new.received_at:=now();
 end if;
 -- Browser-authenticated admins may not bypass the fulfilment state machine.
 if old.cancelled_at is not null and new.stage is distinct from old.stage and new.stage<>'awaiting_design' then raise exception 'This order is cancelled'; end if;
 if current_user='authenticated' then
  if not (select private.is_owner()) then raise exception 'Owner access required'; end if;
  if new.stage is distinct from old.stage then
   if old.cancelled_at is not null or old.payment_status<>'paid' then raise exception 'Order cannot be processed'; end if;
   if not ((old.stage='awaiting_design' and new.stage='design_approved') or
     (old.stage='design_approved' and new.stage='production') or
     (old.stage='production' and new.stage='ready_to_ship') or
     (old.stage='shipped' and new.stage='delivered')) then raise exception 'Invalid fulfilment transition'; end if;
  end if;
  if new.cancelled_at is distinct from old.cancelled_at then
   if old.cancelled_at is not null or new.cancelled_at is null or old.stage in ('shipped','delivered') or exists(select 1 from public.shop_fulfilments where order_id=old.id) then raise exception 'Cannot cancel a dispatched or booked order'; end if;
   if length(trim(coalesce(new.cancellation_reason,'')))<3 then raise exception 'Cancellation reason required'; end if;
  end if;
 end if;
 return new;
end $$;
create trigger admin_order_stamp before update on public.shop_orders for each row execute function public.admin_order_stamp();

create or replace function public.admin_order_audit() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.cancelled_at is distinct from old.cancelled_at then
  insert into public.shop_order_events(order_id,event_type,label,metadata,created_by)
  values(new.id,'cancelled','Order cancelled. Any refund is handled separately.',jsonb_build_object('reason',new.cancellation_reason),(select auth.uid()));
 elsif new.stage is distinct from old.stage and new.stage in ('shipped','delivered') then
  insert into public.shop_order_events(order_id,event_type,label,metadata,created_by)
  values(new.id,'fulfilment',replace(new.stage,'_',' '),jsonb_build_object('from',old.stage,'to',new.stage),(select auth.uid()));
 end if;
 if new.payment_status is distinct from old.payment_status and new.payment_status in ('failed','partially_refunded','refunded') then
  insert into public.shop_order_events(order_id,event_type,label,created_by)
  values(new.id,'payment',replace(new.payment_status,'_',' '),(select auth.uid()));
 end if;
 return new;
end $$;
create trigger admin_order_audit after update on public.shop_orders for each row execute function public.admin_order_audit();

-- Serialise cancellation against the existing shipment-booking reservation.
create or replace function public.admin_booking_guard() returns trigger
language plpgsql security invoker set search_path='' as $$
declare o public.shop_orders;
begin
 select * into o from public.shop_orders where id=new.order_id for update;
 if o.id is null or o.cancelled_at is not null or o.stage<>'ready_to_ship' or o.payment_status<>'paid' then raise exception 'Order is not ready for booking'; end if;
 return new;
end $$;
create trigger admin_booking_guard before insert on public.shop_fulfilments for each row execute function public.admin_booking_guard();
create or replace function public.admin_shipment_touch() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 update public.shop_orders set updated_at=now() where id=new.order_id;
 return new;
end $$;
create trigger admin_shipment_touch after insert or update on public.shop_fulfilments for each row execute function public.admin_shipment_touch();

create or replace function public.admin_order_action(p_id uuid,p_expected timestamptz,p_action text,p_value text default '')
returns void language plpgsql security invoker set search_path='' as $$
declare o public.shop_orders; target text;
begin
 if not (select private.is_owner()) then raise exception 'Owner access required'; end if;
 select * into o from public.shop_orders where id=p_id for update;
 if o.id is null then raise exception 'Order not found'; end if;
 if p_action='read' then
  insert into public.shop_admin_order_state(order_id,read_at) values(p_id,now())
  on conflict(order_id) do update set read_at=now(),updated_at=now();
  return;
 end if;
 if p_action='note' then
  if length(p_value)>5000 then raise exception 'Note too long'; end if;
  insert into public.shop_admin_order_state(order_id,notes) values(p_id,p_value)
  on conflict(order_id) do update set notes=p_value,updated_at=now();
  return;
 end if;
 if o.updated_at is distinct from p_expected then raise exception 'Order changed. Refresh before trying again.'; end if;
 if o.cancelled_at is not null then raise exception 'This order is cancelled'; end if;
 if p_action='cancel' then
  update public.shop_orders set cancelled_at=now(),cancellation_reason=p_value where id=p_id;
  return;
 end if;
 target:=case p_action when 'confirm' then 'design_approved' when 'process' then 'production' when 'pack' then 'ready_to_ship' when 'deliver' then 'delivered' else null end;
 if target is null then raise exception 'Unknown action'; end if;
 update public.shop_orders set stage=target where id=p_id;
 if target<>'delivered' then
  insert into public.shop_order_events(order_id,event_type,label,metadata,created_by)
  values(p_id,'fulfilment',replace(target,'_',' '),jsonb_build_object('from',o.stage,'to',target),(select auth.uid()));
 end if;
end $$;
revoke all on function public.admin_order_action(uuid,timestamptz,text,text) from public,anon;
grant execute on function public.admin_order_action(uuid,timestamptz,text,text) to authenticated;

create or replace function public.admin_order_summary() returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare result jsonb; today_start timestamptz:=date_trunc('day',now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
begin
 if not (select private.is_owner()) then raise exception 'Owner access required'; end if;
 select jsonb_build_object(
 'today',count(*) filter(where o.created_at>=today_start),
 'revenue',coalesce(sum(o.total_paise-o.refunded_paise) filter(where o.payment_status in ('paid','partially_refunded','refunded') and coalesce(o.received_at,p.updated_at)>=today_start),0),
 'pending',count(*) filter(where o.payment_status='pending' and o.cancelled_at is null),
 'process',count(*) filter(where o.stage in ('awaiting_design','design_approved','production') and o.payment_status='paid' and o.cancelled_at is null),
 'ship',count(*) filter(where o.stage='ready_to_ship' and o.payment_status='paid' and o.cancelled_at is null),
 'unread',count(*) filter(where o.payment_status='paid' and o.cancelled_at is null and (s.read_at is null or s.read_at<coalesce(o.received_at,o.created_at))))
 into result from public.shop_orders o left join public.shop_admin_order_state s on s.order_id=o.id left join public.shop_payments p on p.order_id=o.id;
 return result;
end $$;
revoke all on function public.admin_order_summary() from public,anon;
grant execute on function public.admin_order_summary() to authenticated;

create or replace function public.admin_customer_order_totals(p_ids uuid[]) returns table(customer_id uuid,order_count bigint,total_spent bigint,latest_order timestamptz)
language plpgsql stable security invoker set search_path='' as $$
begin
 if not (select private.is_owner()) or cardinality(p_ids)>1000 then raise exception 'Invalid request'; end if;
 return query select a.customer_id,count(o.id),coalesce(sum(o.total_paise-o.refunded_paise) filter(where o.payment_status in ('paid','partially_refunded','refunded')),0)::bigint,max(o.created_at)
 from public.shop_accounts a join public.shop_orders o on o.user_id=a.user_id where a.customer_id=any(p_ids) group by a.customer_id;
end $$;
revoke all on function public.admin_customer_order_totals(uuid[]) from public,anon;
grant execute on function public.admin_customer_order_totals(uuid[]) to authenticated;

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='shop_orders') then alter publication supabase_realtime add table public.shop_orders; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='shop_admin_order_state') then alter publication supabase_realtime add table public.shop_admin_order_state; end if;
end $$;
