-- Must run inside an explicit transaction, followed by ROLLBACK.
select set_config('test.buyer',gen_random_uuid()::text,true);
select set_config('test.owner',(select id::text from public.profiles where role='owner' limit 1),true);
insert into auth.users(id,email,raw_app_meta_data) values(current_setting('test.buyer')::uuid,'admin-audit@example.invalid','{"providers":["google"]}');
do $$
declare oid uuid; payload jsonb; items jsonb; n int;
begin
 for n in 1..2 loop
  payload:=jsonb_build_object('user_id',current_setting('test.buyer'),'request_id',gen_random_uuid(),'reference','AUDIT-'||gen_random_uuid(),'email','admin-audit@example.invalid','address',jsonb_build_object('name','Rollback Test','phone','9000000000','city','Test'),'subtotal_paise',10000,'shipping_paise',500,'total_paise',10500,'courier','test','parcel','{}'::jsonb);
  items:='[{"product_slug":"instagram","variant_id":"standard","name":"Test","variant_name":"Test","image":"/shop/instagram.webp","quantity":1,"price_paise":10000}]';
  oid:=public.shop_create_order(payload,items);
  perform set_config(case when n=1 then 'test.order' else 'test.cancel_order' end,oid::text,true);
  perform public.shop_confirm_payment(replace(oid::text,'-',''),'AUDIT-'||oid,10500);
  perform public.shop_confirm_payment(replace(oid::text,'-',''),'AUDIT-'||oid,10500);
  if (select count(*) from public.transactions where shop_order_id=oid)<>1 then raise exception 'Duplicate verified payment'; end if;
 end loop;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
do $$
declare oid uuid:=current_setting('test.order')::uuid; expected timestamptz; summary jsonb;
begin
 summary:=public.admin_order_summary();
 if (summary->>'unread')::int<2 then raise exception 'Unread detection failed'; end if;
 if (select count(*) from public.shop_orders where id=oid)<>1 then raise exception 'Owner read failed'; end if;
 begin
  update public.shop_orders set payment_status='paid' where id=oid;
  raise exception 'Owner browser can forge payments';
 exception when insufficient_privilege then null;
 end;
 perform public.admin_order_action(oid,null,'read','');
 perform public.admin_order_action(oid,null,'note','Internal test note');
 if (select notes from public.shop_admin_order_state where order_id=oid)<>'Internal test note' then raise exception 'Note failed'; end if;
 select updated_at into expected from public.shop_orders where id=oid;
 begin
  perform public.admin_order_action(oid,expected-interval '1 day','confirm','');
  raise exception 'Stale status edit accepted';
 exception when others then if SQLERRM='Stale status edit accepted' then raise; end if; end;
 perform public.admin_order_action(oid,expected,'confirm','');
 select updated_at into expected from public.shop_orders where id=oid;
 perform public.admin_order_action(oid,expected,'process','');
 select updated_at into expected from public.shop_orders where id=oid;
 perform public.admin_order_action(oid,expected,'pack','');
 if (select count(*) from public.shop_order_events where order_id=oid and event_type='fulfilment')<>3 then raise exception 'Timeline missing or duplicated'; end if;
 select updated_at into expected from public.shop_orders where id=current_setting('test.cancel_order')::uuid;
 perform public.admin_order_action(current_setting('test.cancel_order')::uuid,expected,'cancel','Customer requested cancellation');
 if (select payment_status from public.shop_orders where id=current_setting('test.cancel_order')::uuid)<>'paid' then raise exception 'Cancellation changed payment'; end if;
end $$;
reset role;
insert into public.shop_fulfilments(order_id,booking_status) values(current_setting('test.order')::uuid,'booking');
set local role authenticated;
do $$
declare expected timestamptz;
begin
 select updated_at into expected from public.shop_orders where id=current_setting('test.order')::uuid;
 begin
  perform public.admin_order_action(current_setting('test.order')::uuid,expected,'cancel','Should fail');
  raise exception 'Booked order cancellation accepted';
 exception when others then if SQLERRM='Booked order cancellation accepted' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.buyer'),true);
do $$ begin
 if (select count(*) from public.shop_orders where id=current_setting('test.order')::uuid)<>1 then raise exception 'Purchaser policy changed'; end if;
 if (select count(*) from public.shop_admin_order_state)>0 then raise exception 'Customer can read private notes'; end if;
 if (select count(*) from public.push_subscriptions)>0 then raise exception 'Customer can read device secrets'; end if;
 begin
  perform public.admin_order_summary();
  raise exception 'Customer accessed admin totals';
 exception when others then if SQLERRM='Customer accessed admin totals' then raise; end if; end;
 begin
  perform public.admin_order_action(current_setting('test.order')::uuid,null,'note','forged');
  raise exception 'Customer can alter order';
 exception when others then if SQLERRM='Customer can alter order' then raise; end if; end;
end $$;
reset role;
