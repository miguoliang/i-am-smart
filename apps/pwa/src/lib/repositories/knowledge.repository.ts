import { KnowledgeItem } from '@/lib/services/knowledgeService';

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  level?: string;
  /** When set, only rows whose `code` is in this list. */
  restrictToCodes?: string[];
  /** Only rows with needs_correction = true */
  needsCorrectionOnly?: boolean;
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
}
