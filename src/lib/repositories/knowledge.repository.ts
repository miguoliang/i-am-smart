import { KnowledgeItem, ImportKnowledgeParams } from '@/lib/services/knowledgeService';

export interface KnowledgeRepository {
  getAll(): Promise<KnowledgeItem[]>;
  import(items: ImportKnowledgeParams[]): Promise<{ count: number; skipped: number }>;
}
