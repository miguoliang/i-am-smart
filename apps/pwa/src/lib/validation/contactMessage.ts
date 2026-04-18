import { ApiError } from '@/lib/utils/apiError';

const MIN_BODY = 10;
export const MAX_CONTACT_BODY = 5000;
export const MAX_CONTACT_HINT = 200;

/**
 * Validates contact message body and optional contact hint (WeChat / email / phone as plain text).
 */
export function validateContactMessageInput(body: unknown, contactHint: unknown): { body: string; contactHint: string | null } {
  if (typeof body !== 'string') {
    throw ApiError.validationError('请填写留言内容');
  }
  const trimmed = body.trim();
  if (trimmed.length < MIN_BODY) {
    throw ApiError.validationError(`留言内容至少 ${MIN_BODY} 个字符`);
  }
  if (trimmed.length > MAX_CONTACT_BODY) {
    throw ApiError.validationError(`留言内容不超过 ${MAX_CONTACT_BODY} 字`);
  }

  if (contactHint === undefined || contactHint === null || contactHint === '') {
    return { body: trimmed, contactHint: null };
  }
  if (typeof contactHint !== 'string') {
    throw ApiError.validationError('联系方式格式不正确');
  }
  const hintTrim = contactHint.trim();
  if (hintTrim.length > MAX_CONTACT_HINT) {
    throw ApiError.validationError(`联系方式不超过 ${MAX_CONTACT_HINT} 字`);
  }
  return { body: trimmed, contactHint: hintTrim || null };
}
