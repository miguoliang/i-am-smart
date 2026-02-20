import { KnowledgeItem, ImportKnowledgeParams } from '@/lib/services/knowledgeService';

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  level?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface KnowledgeRepository {
  getAll(): Promise<KnowledgeItem[]>;
  getPaginated(params: PaginationParams): Promise<PaginatedResult<KnowledgeItem>>;
  import(items: ImportKnowledgeParams[]): Promise<{ count: number; skipped: number }>;
}
