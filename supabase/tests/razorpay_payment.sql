-- Run in a scratch database, or as one complete BEGIN/ROLLBACK transaction after
-- all migrations have been applied. No test customer, stock or finance is persisted.
begin;
do $$
declare buyer uuid:=gen_random_uuid(); request uuid:=gen_random_uuid(); oid uuid; first_claim jsonb; second_claim jsonb; rejected boolean:=false;
 product text:='razorpay-verification-'||replace(gen_random_uuid()::text,'-',''); late_order uuid; failed_order uuid;
 provider_order text:='order_'||replace(gen_random_uuid()::text,'-','');
 provider_payment text:='pay_'||replace(gen_random_uuid()::text,'-','');
 payload jsonb; items jsonb;
begin
 insert into auth.users(id,email,raw_app_meta_data)
 values(buyer,'razorpay-test-'||buyer::text||'@example.invalid','{"providers":["google"]}');
 insert into public.shop_products(slug,data,stock)
 values(product,jsonb_build_object('active',true,'name','Temporary test card'),10);
 payload:=jsonb_build_object('user_id',buyer,'request_id',request,'reference','NFC-TEST-'||request::text,
  'checkout_fingerprint',repeat('a',64),'email','test@example.invalid',
  'address',jsonb_build_object('name','Payment Test','phone','9999999999','city','Shahdol','pincode','484001','line1','Test only','state','Madhya Pradesh','country','India'),
  'subtotal_paise',29900,'shipping_paise',5000,'tax_paise',5382,'tax_rate_percent',18,'total_paise',40282,
  'courier','Test','parcel','{"length":9.2,"width":6.2,"height":1.4,"weight":250}'::jsonb);
 items:=jsonb_build_array(jsonb_build_object('product_slug',product,'variant_id','test','name','Test card',
  'variant_name','Test','image','/shop/test.webp','quantity',1,'price_paise',29900,'asset_id',null));
 set local role service_role;
 oid:=public.shop_create_razorpay_order(payload,items);
 if public.shop_create_razorpay_order(payload,items)<>oid then raise exception 'Order retry created a duplicate'; end if;
 if (select stock from public.shop_products where slug=product)<>9 then raise exception 'Stock was reserved more than once'; end if;
 first_claim:=public.shop_claim_razorpay_payment(oid,buyer);
 second_claim:=public.shop_claim_razorpay_payment(oid,buyer);
 if first_claim->>'action'<>'create' or second_claim->>'action'<>'busy' then raise exception 'Parallel provider creation was not blocked'; end if;
 perform public.shop_attach_razorpay_order(oid,provider_order,40282);
 if public.shop_claim_razorpay_payment(oid,buyer)->>'action'<>'reuse' then raise exception 'Linked provider order was not reused'; end if;
 begin
  perform public.shop_confirm_razorpay_payment(oid,provider_order,provider_payment,1,'bad-amount-'||oid::text);
 exception when others then rejected:=true;
 end;
 if not rejected or exists(select 1 from public.transactions where shop_order_id=oid) then raise exception 'Mismatched amount entered finance'; end if;
 perform public.shop_confirm_razorpay_payment(oid,provider_order,provider_payment,40282,'same-event-'||oid::text);
 perform public.shop_confirm_razorpay_payment(oid,provider_order,provider_payment,40282,'same-event-'||oid::text);
 perform public.shop_confirm_razorpay_payment(oid,provider_order,provider_payment,40282,'another-event-'||oid::text);
 if (select count(*) from public.transactions where shop_order_id=oid)<>1 then raise exception 'Duplicate payment entered finance'; end if;
 if (select sum(amount_paise) from public.transactions where shop_order_id=oid)<>40282 then raise exception 'Tax or shipping missing from income'; end if;
 if (select stock from public.shop_products where slug=product)<>9 then raise exception 'Payment decremented stock twice'; end if;
 if not exists(select 1 from public.shop_orders where id=oid and payment_status='paid' and stage='awaiting_design') then raise exception 'Order did not enter fulfilment'; end if;
 if (select count(*) from public.shop_accounts where user_id=buyer)<>1 then raise exception 'Customer creation was duplicated'; end if;
 if has_function_privilege('anon','public.shop_confirm_razorpay_payment(uuid,text,text,bigint,text)','execute')
  or has_function_privilege('authenticated','public.shop_confirm_razorpay_payment(uuid,text,text,bigint,text)','execute') then raise exception 'Payment RPC exposed to clients'; end if;
 -- Late capture after explicit cancellation: another purchaser has consumed the
 -- returned units. Collected cash must remain visible without reserving phantom stock.
 payload:=jsonb_set(jsonb_set(payload,'{request_id}',to_jsonb(gen_random_uuid())),'{reference}',to_jsonb('NFC-LATE-'||gen_random_uuid()::text));
 late_order:=public.shop_create_razorpay_order(payload,items);
 perform public.shop_attach_razorpay_order(late_order,'order_LateCapture',40282);
 update public.shop_orders set cancelled_at=now(),cancellation_reason='Owner cancelled before capture' where id=late_order;
 update public.shop_products set stock=0 where slug=product;
 perform public.shop_confirm_razorpay_payment(late_order,'order_LateCapture','pay_LateCapture',40282,'evt_LateCapture');
 perform public.shop_confirm_razorpay_payment(late_order,'order_LateCapture','pay_LateCapture',40282,'evt_LateCapture');
 if (select count(*) from public.transactions where shop_order_id=late_order)<>1 then raise exception 'Cancelled late capture was not recorded exactly once'; end if;
 if not exists(select 1 from public.shop_orders where id=late_order and payment_status='paid' and cancelled_at is not null) then raise exception 'Cancelled late capture became fulfillable'; end if;
 if (select stock from public.shop_products where slug=product)<>0 or exists(select 1 from public.shop_order_items where order_id=late_order and stock_reserved) then raise exception 'Cancelled late capture reallocated released stock'; end if;
 -- Delayed capture after failure also records money and blocks fulfilment when
 -- returned stock cannot safely be reacquired.
 update public.shop_products set stock=1 where slug=product;
 payload:=jsonb_set(jsonb_set(payload,'{request_id}',to_jsonb(gen_random_uuid())),'{reference}',to_jsonb('NFC-FAILED-'||gen_random_uuid()::text));
 failed_order:=public.shop_create_razorpay_order(payload,items);
 perform public.shop_attach_razorpay_order(failed_order,'order_FailedCapture',40282);
 update public.shop_orders set payment_status='failed' where id=failed_order;
 update public.shop_products set stock=0 where slug=product;
 perform public.shop_confirm_razorpay_payment(failed_order,'order_FailedCapture','pay_FailedCapture',40282,'evt_FailedCapture');
 if (select count(*) from public.transactions where shop_order_id=failed_order)<>1 or not exists(select 1 from public.shop_orders where id=failed_order and payment_status='paid' and cancelled_at is not null) then raise exception 'Released-stock capture lost income or allowed overselling'; end if;
 reset role;
 if position('order by slug for update' in pg_get_functiondef('public.shop_create_razorpay_order(jsonb,jsonb)'::regprocedure))=0
  or position('order by slug for update' in pg_get_functiondef('private.release_shop_stock()'::regprocedure))=0 then raise exception 'Canonical stock locking missing'; end if;
 raise notice 'Razorpay payment, stock, customer, amount and duplicate-event assertions passed';
end $$;
rollback;
