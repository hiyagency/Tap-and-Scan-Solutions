-- Publish the owner-requested keychain price once. Future admin edits remain authoritative.
-- Leave card/standee prices, stock and historical order items untouched.
update public.shop_products p
set data = jsonb_set(p.data, '{variants}', (
  select jsonb_agg(jsonb_set(v, '{price_paise}', '24900'::jsonb) order by n)
  from jsonb_array_elements(p.data->'variants') with ordinality as variants(v, n)
)), updated_at = now()
where p.slug in (
  'social-profile-keychain',
  'google-review-keyring',
  'faux-leather-nfc-keychains',
  'ntag216-epoxy-tags'
);
