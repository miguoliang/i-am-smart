// API functions for knowledge
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

export async function fetchKnowledges(): Promise<Knowledge[]> {
  const res = await fetch("/api/knowledge");
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("权限不足");
    }
    throw new Error("加载失败");
  }
  const json = await res.json();
  // API returns { data: [...] }, extract the data array
  return json.data || [];
}

