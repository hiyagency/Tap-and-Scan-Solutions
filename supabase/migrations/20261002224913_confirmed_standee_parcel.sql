-- Owner-confirmed provisional outer standee parcel: 18 x 13 x 5 cm, packed weight 650 g.
-- Change only packaging; preserve stock, price, artwork and past order parcels.
update public.shop_products
set data=jsonb_set(jsonb_set(data,'{shipping}',
 '{"weightGrams":650,"lengthCm":18,"widthCm":13,"heightCm":5}'::jsonb),
 '{packedWeightGrams}','650'::jsonb),updated_at=now()
where slug='smart-nfc-standee';
