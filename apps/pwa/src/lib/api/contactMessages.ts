import type { ContactMessage } from '@/lib/types/contactMessage';
import { parseApiErrorResponse } from '@/lib/utils/apiError';

export interface ContactMessagesResponse {
  data: ContactMessage[];
  total: number;
}

export async function fetchContactMessages(
  page: number = 1,
  limit: number = 10
): Promise<ContactMessagesResponse> {
  const res = await fetch(
    `/api/operator/contact-messages?page=${page}&limit=${limit}`
  );
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, '获取留言列表失败');
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchContactAttachmentSignedUrls(
  paths: string[]
): Promise<Record<string, string>> {
  if (paths.length === 0) {
    return {};
  }
  const res = await fetch('/api/operator/contact-messages/signed-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, '获取附件链接失败');
    throw new Error(message);
  }
  const json = await res.json();
  return json.data as Record<string, string>;
}
