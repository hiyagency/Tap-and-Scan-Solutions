-- Real product media lives in public/shop. Stock was confirmed as ten units.
-- No parcel dimensions or weight have been supplied, so shipping remains null.
insert into public.shop_products (slug, position, stock, data)
values (
  'smart-nfc-standee', -1, 10,
  '{"slug":"smart-nfc-standee","name":"Smart NFC Standee","platform":"Custom NFC + smart QR","description":"A custom 4 × 6 inch acrylic standee that puts your chosen destinations one tap or scan away. Designed for counters, reception desks and tables.","colour":"#efe8b8","category":"Standees","kind":"standee","qr":true,"customLogo":true,"active":true,"specifications":"Display size: 4 × 6 inches. NFC tap and custom smart QR destinations. Each destination and artwork is confirmed with our team before production.","materials":"Acrylic standee with high-quality printed sticker and a resin-coated surface. Built to resist everyday water exposure and surface scuffs; avoid abrasive cleaners and prolonged soaking.","instructions":"Place the standee where customers can easily reach and scan it. They can tap with an NFC-enabled phone or scan the QR code with a camera. Our team contacts you on WhatsApp to confirm artwork and destinations before production.","variants":[{"id":"smart-nfc-standee","name":"Custom design","image":"/shop/standee-la-pinoz.webp","video":"/shop/smart-nfc-standee.mp4","price_paise":129900,"available":true}]}'::jsonb
)
on conflict (slug) do nothing;
