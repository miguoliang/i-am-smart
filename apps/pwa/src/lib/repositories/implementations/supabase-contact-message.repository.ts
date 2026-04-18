import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContactAttachmentRef } from '@/lib/types/contactMessage';
import type { ContactMessage, ContactMessageRepository } from '../contactMessage.repository';
import { handleRepositoryError } from '../utils/error-handling';

export class SupabaseContactMessageRepository implements ContactMessageRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(page: number = 1, limit: number = 10): Promise<{ data: ContactMessage[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await this.client
      .from('contact_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      handleRepositoryError(error, 'Get contact messages');
    }

    const rows = (data as ContactMessage[]) || [];
    return {
      data: rows.map((row) => ({
        ...row,
        attachments: row.attachments ?? [],
      })),
      total: count || 0,
    };
  }

  async create(
    userId: string,
    body: string,
    contactHint: string | null,
    attachments: ContactAttachmentRef[]
  ): Promise<void> {
    const { error } = await this.client.from('contact_messages').insert({
      user_id: userId,
      body,
      contact_hint: contactHint,
      attachments,
    });

    if (error) {
      handleRepositoryError(error, 'Create contact message');
    }
  }
}
