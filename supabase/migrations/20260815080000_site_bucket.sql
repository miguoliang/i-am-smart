-- Public Storage bucket leftover from an earlier HTML-hosting experiment.
-- The Vite SPA is served by Netlify; pack images use `pack-images`.

insert into storage.buckets (id, name, public)
values ('site', 'site', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "site_select_public" on storage.objects;
create policy "site_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'site');
