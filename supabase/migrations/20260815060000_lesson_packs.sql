-- Peilian lesson packs (content layer). Framework stays in the web app.
-- Apply with: node scripts/apply-supabase-schema.mjs

create table if not exists public.lesson_packs (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title_zh text not null,
  title_en text not null default '',
  blurb text not null default '',
  document jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists lesson_packs_owner_updated_idx
  on public.lesson_packs (owner_id, updated_at desc);

alter table public.lesson_packs enable row level security;

drop policy if exists "lesson_packs_select_own" on public.lesson_packs;
create policy "lesson_packs_select_own"
  on public.lesson_packs for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "lesson_packs_insert_own" on public.lesson_packs;
create policy "lesson_packs_insert_own"
  on public.lesson_packs for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "lesson_packs_update_own" on public.lesson_packs;
create policy "lesson_packs_update_own"
  on public.lesson_packs for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "lesson_packs_delete_own" on public.lesson_packs;
create policy "lesson_packs_delete_own"
  on public.lesson_packs for delete
  to authenticated
  using (auth.uid() = owner_id);

grant select, insert, update, delete on public.lesson_packs to authenticated;

insert into storage.buckets (id, name, public)
values ('pack-images', 'pack-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "pack_images_select_public" on storage.objects;
create policy "pack_images_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'pack-images');

drop policy if exists "pack_images_insert_own" on storage.objects;
create policy "pack_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pack-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "pack_images_update_own" on storage.objects;
create policy "pack_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pack-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'pack-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "pack_images_delete_own" on storage.objects;
create policy "pack_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pack-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
