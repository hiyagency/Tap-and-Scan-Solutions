create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  business_name text,
  city text,
  caption text,
  alt_text text not null check (char_length(alt_text) between 5 and 180),
  image_path text not null unique,
  shipped_on date not null default current_date,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipments_public_order_idx
  on public.shipments (published, shipped_on desc, sort_order desc);

create trigger shipments_set_updated_at
before update on public.shipments
for each row execute function private.set_updated_at();

alter table public.shipments enable row level security;

create policy "owner can select shipments"
on public.shipments for select to authenticated
using ((select private.is_owner()));

create policy "owner can insert shipments"
on public.shipments for insert to authenticated
with check ((select private.is_owner()));

create policy "owner can update shipments"
on public.shipments for update to authenticated
using ((select private.is_owner()))
with check ((select private.is_owner()));

create policy "owner can delete shipments"
on public.shipments for delete to authenticated
using ((select private.is_owner()));

grant select, insert, update, delete on public.shipments to authenticated;
revoke all on public.shipments from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shipments',
  'shipments',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "owner can upload shipment images"
on storage.objects for insert to authenticated
with check (bucket_id = 'shipments' and (select private.is_owner()));

create policy "owner can update shipment images"
on storage.objects for update to authenticated
using (bucket_id = 'shipments' and (select private.is_owner()))
with check (bucket_id = 'shipments' and (select private.is_owner()));

create policy "owner can delete shipment images"
on storage.objects for delete to authenticated
using (bucket_id = 'shipments' and (select private.is_owner()));
