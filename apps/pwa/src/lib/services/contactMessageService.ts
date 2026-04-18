import type { ContactAttachmentRef } from '@/lib/types/contactMessage';
import type { ContactMessageRepository } from '@/lib/repositories/contactMessage.repository';

export class ContactMessageService {
  constructor(private repository: ContactMessageRepository) {}

  async getMessages(page: number = 1, limit: number = 10) {
    return this.repository.getAll(page, limit);
  }

  async submitMessage(
    userId: string,
    body: string,
    contactHint: string | null,
    attachments: ContactAttachmentRef[]
  ): Promise<void> {
    await this.repository.create(userId, body, contactHint, attachments);
  }
}
