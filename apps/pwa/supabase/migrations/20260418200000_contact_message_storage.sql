-- Private bucket for contact message attachments (images/videos, max 5 MiB per object via bucket limit)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-attachments',
  'contact-attachments',
  false,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Link attachment metadata on messages (paths point into storage.objects)
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_attachments_shape;
ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_attachments_shape CHECK (
    jsonb_typeof(attachments) = 'array'
    AND jsonb_array_length(attachments) <= 5
  );

-- Storage: users may only upload under their user id prefix
CREATE POLICY "contact_attachments_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'contact-attachments'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

CREATE POLICY "contact_attachments_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'contact-attachments'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

CREATE POLICY "contact_attachments_select_operator"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'contact-attachments'
    AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
  );

CREATE POLICY "contact_attachments_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'contact-attachments'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );
