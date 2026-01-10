import { useState, useRef } from "react";
import { CefrKnowledgeItem } from "@/lib/api/import";

export interface JSONData {
  items: CefrKnowledgeItem[];
}

export function useJSONParser() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<JSONData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".json")) {
      setError("仅支持 JSON 文件格式");
      return;
    }

    setFile(selectedFile);
    setError(null);

    try {
      const text = await selectedFile.text();
      const parsed = JSON.parse(text) as CefrKnowledgeItem[];

      // Validate structure
      if (!Array.isArray(parsed)) {
        throw new Error("JSON 文件必须包含一个数组");
      }

      if (parsed.length === 0) {
        throw new Error("JSON 文件为空");
      }

      // Validate each item has required fields
      for (const item of parsed) {
        if (!item || typeof item !== 'object') {
          throw new Error("每个项目必须是对象");
        }
        if (!item.englishWord || typeof item.englishWord !== 'string') {
          throw new Error("每个项目必须包含 'englishWord' 字段（字符串）");
        }
      }

      setPreviewData({ items: parsed });
    } catch (err) {
      const message = err instanceof Error ? err.message : "JSON 文件解析失败，请检查文件格式";
      setError(message);
      setFile(null);
      setPreviewData(null);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    file,
    previewData,
    error,
    handleFileChange,
    reset,
    fileInputRef,
  };
}

