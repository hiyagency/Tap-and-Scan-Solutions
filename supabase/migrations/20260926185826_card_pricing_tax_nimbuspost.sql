-- Existing orders keep their original totals and legacy provider.
alter table public.shop_orders add column tax_paise bigint not null default 0 check(tax_paise>=0);
alter table public.shop_orders add column tax_rate_percent integer not null default 0 check(tax_rate_percent in (0,18));
alter table public.shop_orders add column shipping_provider text not null default 'ithink' check(shipping_provider in ('ithink','nimbuspost'));
alter table public.shop_orders drop constraint shop_orders_check;
alter table public.shop_orders add constraint shop_orders_total_check check(total_paise=subtotal_paise+shipping_paise+tax_paise);
alter table public.shop_orders add constraint shop_orders_tax_check check(tax_paise=round(subtotal_paise::numeric*tax_rate_percent/100)::bigint);

create or replace function public.shop_create_order(payload jsonb, items jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare oid uuid; item jsonb; asset_owner uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(payload->>'user_id',0));
 select id into oid from public.shop_orders where user_id=(payload->>'user_id')::uuid and request_id=(payload->>'request_id')::uuid;
 if oid is not null then
  if not exists(select 1 from public.shop_orders where id=oid and total_paise=(payload->>'total_paise')::bigint and tax_paise=(payload->>'tax_paise')::bigint and address=payload->'address') then raise exception 'Order changed; begin a new checkout'; end if;
  return oid;
 end if;
 if (payload->>'tax_paise')::bigint is distinct from round((payload->>'subtotal_paise')::numeric * 0.18)::bigint then raise exception 'Incorrect tax'; end if;
 if (select count(*) from public.shop_orders where user_id=(payload->>'user_id')::uuid and created_at>now()-interval '1 hour')>=10 then raise exception 'Please wait before creating another order'; end if;
 insert into public.shop_orders(user_id,request_id,reference,email,address,subtotal_paise,shipping_paise,total_paise,courier,parcel,tax_paise,tax_rate_percent,shipping_provider)
 values((payload->>'user_id')::uuid,(payload->>'request_id')::uuid,payload->>'reference',payload->>'email',payload->'address',(payload->>'subtotal_paise')::bigint,(payload->>'shipping_paise')::bigint,(payload->>'total_paise')::bigint,payload->>'courier',payload->'parcel',(payload->>'tax_paise')::bigint,18,'nimbuspost') returning id into oid;
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

-- Only the seven existing card products and their variants; no keychains or historical order items.
update public.shop_products p set data=jsonb_set(data,'{variants}',(
 select jsonb_agg(jsonb_set(v,'{price_paise}','29900'::jsonb) order by n)
 from jsonb_array_elements(p.data->'variants') with ordinality as variants(v,n)
)),updated_at=now()
where slug in ('google-reviews','instagram','whatsapp','multi-link','linkedin','zomato','facebook');
