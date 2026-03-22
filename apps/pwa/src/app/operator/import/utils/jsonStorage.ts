import { CefrKnowledgeItem } from "@/lib/api/import";

const STORAGE_KEY = "import_json_data";
const STORAGE_FILE_NAME_KEY = "import_json_filename";

export interface StoredJSONData {
  items: CefrKnowledgeItem[];
  fileName: string;
}

export function saveJSONData(items: CefrKnowledgeItem[], fileName: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  sessionStorage.setItem(STORAGE_FILE_NAME_KEY, fileName);
}

export function getJSONData(): StoredJSONData | null {
  if (typeof window === "undefined") return null;
  
  const dataStr = sessionStorage.getItem(STORAGE_KEY);
  const fileName = sessionStorage.getItem(STORAGE_FILE_NAME_KEY);
  
  if (!dataStr || !fileName) return null;
  
  try {
    const items = JSON.parse(dataStr) as CefrKnowledgeItem[];
    return { items, fileName };
  } catch {
    return null;
  }
}

export function clearJSONData() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_FILE_NAME_KEY);
}

