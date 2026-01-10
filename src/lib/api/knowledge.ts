// API functions for knowledge
import { t } from "@/lib/i18n";

export interface KnowledgeMetadata {
  [key: string]: unknown;
}

export interface Knowledge {
  code: string;
  name: string;
  description: string;
  metadata: KnowledgeMetadata;
  created_at: string;
  updated_at: string;
}

export interface PaginatedKnowledgeResult {
  data: Knowledge[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FetchKnowledgesParams {
  page?: number;
  pageSize?: number;
}

export async function fetchKnowledges(params: FetchKnowledgesParams = {}): Promise<PaginatedKnowledgeResult> {
  const { page = 1, pageSize = 10 } = params;
  const searchParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  const res = await fetch(`/api/knowledge?${searchParams.toString()}`);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(t().auth.forbidden);
    }
    throw new Error("Failed to load knowledge");
  }
  const json = await res.json();
  // API returns { data: { data, total, page, pageSize, totalPages } }
  return json.data || { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
}

