-- Additive migration: paid/free rows keep the existing order subtotal invariant.
alter table public.shop_order_items drop constraint shop_order_items_price_paise_check;
alter table public.shop_order_items add constraint shop_order_items_price_paise_check check (price_paise >= 0);

create table public.shop_reviews (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 product_slug text not null references public.shop_products(slug),
 display_name text not null check (char_length(display_name) between 2 and 60),
 rating integer not null check (rating between 1 and 5),
 body text not null check (char_length(body) between 10 and 2000),
 photos text[] not null default '{}' check (cardinality(photos) <= 2),
 verified_purchase boolean not null default false,
 status text not null default 'pending' check (status in ('uploading','pending','approved','rejected')),
 created_at timestamptz not null default now(),
 unique(user_id,product_slug)
);
create index shop_reviews_product_status_created on public.shop_reviews(product_slug,status,created_at desc);
create index shop_reviews_user_created on public.shop_reviews(user_id,created_at desc);
alter table public.shop_reviews enable row level security;
-- Reviews are read through a safe server projection; only server routes can mutate.
revoke all on public.shop_reviews from anon,authenticated;
grant all on public.shop_reviews to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('review-photos','review-photos',false,1048576,array['image/webp'])
on conflict(id) do nothing;

update public.shop_products set data=jsonb_set(data,'{shipping}',
 '{"weightGrams":250,"lengthCm":9.2,"widthCm":6.2,"heightCm":1.4}'::jsonb),updated_at=now()
where slug in ('google-reviews','instagram','whatsapp','multi-link','linkedin','zomato','facebook')
 and not (data ? 'shipping');
