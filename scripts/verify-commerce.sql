-- Disposable verification: all test users, orders and financial entries roll back.
begin;
select set_config('test.buyer',gen_random_uuid()::text,true);
select set_config('test.other',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_app_meta_data) values
 (current_setting('test.buyer')::uuid,'commerce-test@example.invalid','{"providers":["google"]}'),
 (current_setting('test.other')::uuid,'other-test@example.invalid','{"providers":["google"]}');
do $$
declare oid uuid; repeated uuid; payload jsonb; items jsonb; txn text; ledger_count int;
begin
 payload:=jsonb_build_object('user_id',current_setting('test.buyer'),'request_id',gen_random_uuid(),'reference','TEST-'||gen_random_uuid(),'email','commerce-test@example.invalid','address',jsonb_build_object('name','ROLLBACK TEST','phone','9000000000','city','Test'),'subtotal_paise',10000,'shipping_paise',500,'total_paise',10500,'courier','test','parcel','{}'::jsonb);
 items:='[{"product_slug":"instagram","variant_id":"standard","name":"Test","variant_name":"Test","image":"/shop/instagram.webp","quantity":1,"price_paise":10000}]';
 oid:=public.shop_create_order(payload,items);
 repeated:=public.shop_create_order(payload,items);
 if oid<>repeated then raise exception 'Duplicate request created another order'; end if;
 perform set_config('test.order',oid::text,true);
 txn:=replace(oid::text,'-','');
 begin
  perform public.shop_confirm_payment(txn,'TEST-'||oid,9999);
  raise exception 'Mismatched payment was accepted';
 exception when others then
  if SQLERRM='Mismatched payment was accepted' then raise; end if;
 end;
 perform public.shop_confirm_payment(txn,'TEST-'||oid,10500);
 perform public.shop_confirm_payment(txn,'TEST-'||oid,10500);
 select count(*) into ledger_count from public.transactions where shop_order_id=oid;
 if ledger_count<>1 then raise exception 'Duplicate payment counted twice'; end if;
 if exists(select 1 from public.profiles where id=current_setting('test.buyer')::uuid) then raise exception 'Customer received owner profile'; end if;
 perform public.shop_advance_order(oid,'design_approved');
 perform public.shop_advance_order(oid,'production');
 perform public.shop_advance_order(oid,'ready_to_ship');
 perform public.shop_record_expense(oid,1000,'refund-test:'||oid,'order_refund');
 perform public.shop_record_expense(oid,1000,'refund-test:'||oid,'order_refund');
 if (select sum(case when type='income' then amount_paise else -amount_paise end) from public.transactions where shop_order_id=oid)<>9500 then raise exception 'Ledger total mismatch'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.buyer'),true);
do $$ begin
 if (select count(*) from public.shop_orders where id=current_setting('test.order')::uuid)<>1 then raise exception 'Buyer cannot read own order'; end if;
 if (select count(*) from public.customers)>0 then raise exception 'Customer can read CRM'; end if;
 if has_function_privilege('authenticated','public.shop_confirm_payment(text,text,bigint)','EXECUTE') then raise exception 'Customer can confirm payment'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.other'),true);
do $$ begin
 if (select count(*) from public.shop_orders where id=current_setting('test.order')::uuid)<>0 then raise exception 'Buyer can read another order'; end if;
 if (select count(*) from public.shop_order_items where order_id=current_setting('test.order')::uuid)<>0 then raise exception 'Buyer can read another order items'; end if;
end $$;
set local role anon;
do $$ begin
 if has_table_privilege('anon','public.shop_orders','SELECT') then raise exception 'Anonymous order read allowed'; end if;
 if has_table_privilege('anon','public.shop_assets','INSERT') then raise exception 'Anonymous asset write allowed'; end if;
 if (select count(*) from public.shop_products)<>7 then raise exception 'Public catalogue unavailable'; end if;
end $$;
rollback;
