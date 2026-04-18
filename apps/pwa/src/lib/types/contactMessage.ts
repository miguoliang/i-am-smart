export interface ContactAttachmentRef {
  path: string;
  mime_type: string;
  size_bytes: number;
}

export interface ContactMessage {
  id: number;
  user_id: string;
  body: string;
  contact_hint: string | null;
  attachments: ContactAttachmentRef[];
  created_at: string;
  updated_at: string;
  status: string;
  operator_note: string | null;
}
