/** Supabase Storage bucket id (must match migration). */
export const CONTACT_ATTACHMENTS_BUCKET = 'contact-attachments';

/** 5 MiB per file (must match bucket file_size_limit). */
export const MAX_CONTACT_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const MAX_CONTACT_ATTACHMENTS_PER_MESSAGE = 5;

/** Allowed MIME types for uploads (must stay in sync with bucket allowed_mime_types). */
export const ALLOWED_CONTACT_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export type AllowedContactAttachmentMime = (typeof ALLOWED_CONTACT_ATTACHMENT_MIME_TYPES)[number];

const MIME_TO_EXT: Partial<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export function extensionForContactMime(mime: string): string {
  return MIME_TO_EXT[mime] ?? 'bin';
}

export function isAllowedContactAttachmentMime(mime: string): mime is AllowedContactAttachmentMime {
  return (ALLOWED_CONTACT_ATTACHMENT_MIME_TYPES as readonly string[]).includes(mime);
}
