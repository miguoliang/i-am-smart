import { useMutation } from "@tanstack/react-query";
import { importKnowledge, type ImportResult, type CefrKnowledgeItem } from "@/lib/api/import";
import { getErrorMessage } from "@/lib/utils/errorUtils";

export function useWordImport() {
  const { mutateAsync: importKnowledgeItems, isPending: loading, error } = useMutation({
    mutationFn: (items: CefrKnowledgeItem[]): Promise<ImportResult> => importKnowledge(items),
  });

  return {
    loading,
    error: error ? getErrorMessage(error) : null,
    importKnowledge: importKnowledgeItems,
  };
}

