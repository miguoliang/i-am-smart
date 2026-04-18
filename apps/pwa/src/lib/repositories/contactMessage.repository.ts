import type { ContactAttachmentRef, ContactMessage } from '@/lib/types/contactMessage';

export type { ContactMessage };

export interface ContactMessageRepository {
  getAll(page: number, limit: number): Promise<{ data: ContactMessage[]; total: number }>;
  create(
    userId: string,
    body: string,
    contactHint: string | null,
    attachments: ContactAttachmentRef[]
  ): Promise<void>;
}
