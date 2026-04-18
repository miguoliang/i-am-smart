import { NextRequest } from 'next/server';
import { apiSuccess, handleApiError, ApiError } from '@/lib/utils/apiError';
import { requireOperator } from '@/lib/middleware/auth';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { CONTACT_ATTACHMENTS_BUCKET } from '@/lib/contact-attachments/config';

const SIGNED_URL_TTL_SEC = 900;
const MAX_PATHS = 20;

function isSafeAttachmentPath(path: string): boolean {
  if (path.length > 512 || path.includes('..') || path.startsWith('/')) {
    return false;
  }
  const parts = path.split('/');
  if (parts.length !== 2) {
    return false;
  }
  return (
    /^[0-9a-f-]{36}$/i.test(parts[0]) &&
    /^[a-zA-Z0-9._-]+$/.test(parts[1])
  );
}

/** POST: signed URLs for viewing contact attachments (operator only). */
export async function POST(req: NextRequest) {
  try {
    await requireOperator(req);
    let paths: unknown;
    try {
      paths = (await req.json()).paths;
    } catch {
      throw ApiError.validationError('请求体必须是 JSON');
    }
    if (!Array.isArray(paths) || paths.length === 0) {
      throw ApiError.validationError('缺少 paths');
    }
    if (paths.length > MAX_PATHS) {
      throw ApiError.validationError(`一次最多请求 ${MAX_PATHS} 个附件地址`);
    }

    const admin = createSupabaseAdmin();
    const result: Record<string, string> = {};

    for (const p of paths) {
      if (typeof p !== 'string' || !isSafeAttachmentPath(p)) {
        throw ApiError.validationError('附件路径无效');
      }
      const { data, error } = await admin.storage
        .from(CONTACT_ATTACHMENTS_BUCKET)
        .createSignedUrl(p, SIGNED_URL_TTL_SEC);
      if (error || !data?.signedUrl) {
        throw ApiError.validationError('无法生成附件链接');
      }
      result[p] = data.signedUrl;
    }

    return apiSuccess(result);
  } catch (e) {
    return handleApiError(e);
  }
}
