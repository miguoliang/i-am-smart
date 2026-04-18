import { NextRequest } from 'next/server';
import { apiSuccess, handleApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';
import { createContactMessageService } from '@/lib/services/factory';
import { requireAuth } from '@/lib/middleware/auth';
import { validateContactMessageInput } from '@/lib/validation/contactMessage';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyContactAttachmentRefs } from '@/lib/contact-attachments/verifyStorage';

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);
    const json = await req.json();
    const { body, contactHint } = validateContactMessageInput(json.body, json.contact_hint);

    const admin = createSupabaseAdmin();
    const attachments = await verifyContactAttachmentRefs(admin, user.id, json.attachments);

    const service = await createContactMessageService(supabase);
    await service.submitMessage(user.id, body, contactHint, attachments);

    logger.info('Contact message submitted', {
      userId: user.id,
      attachmentCount: attachments.length,
    });

    return apiSuccess({ message: '留言已提交，我们会尽快查看。' });
  } catch (error) {
    return handleApiError(error);
  }
}
