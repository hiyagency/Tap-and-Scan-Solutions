-- Owner-confirmed outer keychain carton: 10 x 10 x 10 cm, packed weight 250 g.
-- Apply additively; preserve stock, prices, purchased items and other catalogue fields.
update public.shop_products
set data=jsonb_set(jsonb_set(data,'{shipping}',
 '{"weightGrams":250,"lengthCm":10,"widthCm":10,"heightCm":10}'::jsonb),
 '{packedWeightGrams}','250'::jsonb),updated_at=now()
where slug in ('social-profile-keychain','google-review-keyring','faux-leather-nfc-keychains','ntag216-epoxy-tags');

-- Publish the current standee cover only where the original seeded cover remains.
update public.shop_products
set data=jsonb_set(data,'{variants,0,image}','"/shop/standee-kidzee-studio-v1.webp"'::jsonb),updated_at=now()
where slug='smart-nfc-standee' and data#>>'{variants,0,image}'='/shop/standee-la-pinoz.webp';
