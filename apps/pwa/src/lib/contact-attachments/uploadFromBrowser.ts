'use client';

import { createClient } from '@/lib/supabaseClient';
import type { ContactAttachmentRef } from '@/lib/types/contactMessage';
import {
  CONTACT_ATTACHMENTS_BUCKET,
  MAX_CONTACT_ATTACHMENT_BYTES,
  isAllowedContactAttachmentMime,
  extensionForContactMime,
} from '@/lib/contact-attachments/config';

/**
 * Uploads a single image/video for a contact message. Caller must enforce per-message count and total size.
 */
export async function uploadContactAttachmentFromBrowser(
  file: File,
  userId: string
): Promise<ContactAttachmentRef> {
  const mime = file.type.trim();
  if (!mime || !isAllowedContactAttachmentMime(mime)) {
    throw new Error('仅支持常见图片或视频格式');
  }
  if (file.size > MAX_CONTACT_ATTACHMENT_BYTES) {
    throw new Error('单个附件不能超过 5 MB');
  }

  const supabase = createClient();
  const ext = extensionForContactMime(mime);
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(CONTACT_ATTACHMENTS_BUCKET).upload(path, file, {
    contentType: mime,
    upsert: false,
    cacheControl: '3600',
  });

  if (error) {
    throw new Error(error.message || '上传失败');
  }

  return {
    path,
    mime_type: mime,
    size_bytes: file.size,
  };
}
