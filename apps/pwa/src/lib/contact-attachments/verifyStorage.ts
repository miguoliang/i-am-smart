import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/utils/apiError';
import type { ContactAttachmentRef } from '@/lib/types/contactMessage';
import {
  CONTACT_ATTACHMENTS_BUCKET,
  MAX_CONTACT_ATTACHMENT_BYTES,
  MAX_CONTACT_ATTACHMENTS_PER_MESSAGE,
  isAllowedContactAttachmentMime,
} from '@/lib/contact-attachments/config';

function isSafeUserObjectPath(userId: string, path: string): boolean {
  if (path.length > 512 || path.includes('..') || path.startsWith('/')) {
    return false;
  }
  const parts = path.split('/');
  if (parts.length !== 2) {
    return false;
  }
  if (parts[0] !== userId) {
    return false;
  }
  return /^[a-zA-Z0-9._-]+$/.test(parts[1]);
}

/**
 * Ensures each attachment exists in Storage under the user's prefix, MIME is allowed, and size ≤ limit.
 * Uses the service role client to read objects regardless of RLS.
 */
export async function verifyContactAttachmentRefs(
  admin: SupabaseClient,
  userId: string,
  raw: unknown
): Promise<ContactAttachmentRef[]> {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (!Array.isArray(raw)) {
    throw ApiError.validationError('附件格式无效');
  }
  if (raw.length > MAX_CONTACT_ATTACHMENTS_PER_MESSAGE) {
    throw ApiError.validationError(`最多上传 ${MAX_CONTACT_ATTACHMENTS_PER_MESSAGE} 个附件`);
  }

  const verified: ContactAttachmentRef[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      throw ApiError.validationError('附件格式无效');
    }
    const rec = item as Record<string, unknown>;
    const path = rec.path;
    const mimeType = rec.mime_type;
    const sizeBytes = rec.size_bytes;

    if (typeof path !== 'string' || typeof mimeType !== 'string') {
      throw ApiError.validationError('附件格式无效');
    }
    if (typeof sizeBytes !== 'number' || !Number.isFinite(sizeBytes) || sizeBytes < 1) {
      throw ApiError.validationError('附件格式无效');
    }
    if (!isAllowedContactAttachmentMime(mimeType)) {
      throw ApiError.validationError('不支持的附件类型，仅支持常见图片或视频格式');
    }
    if (sizeBytes > MAX_CONTACT_ATTACHMENT_BYTES) {
      throw ApiError.validationError('单个附件不能超过 5 MB');
    }
    if (!isSafeUserObjectPath(userId, path)) {
      throw ApiError.validationError('附件路径无效');
    }

    const { data: blob, error } = await admin.storage.from(CONTACT_ATTACHMENTS_BUCKET).download(path);
    if (error || !blob) {
      throw ApiError.validationError('附件不存在或已失效，请重新上传');
    }
    if (blob.size > MAX_CONTACT_ATTACHMENT_BYTES) {
      throw ApiError.validationError('单个附件不能超过 5 MB');
    }

    verified.push({
      path,
      mime_type: mimeType,
      size_bytes: blob.size,
    });
  }

  return verified;
}
