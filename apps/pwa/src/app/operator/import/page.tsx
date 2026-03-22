"use client";

import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { useJSONParser } from "./hooks/useJSONParser";
import { FileInput } from "./components/FileInput";
import { NextButton } from "./components/NextButton";
import { saveJSONData } from "./utils/jsonStorage";

export default function ImportLibrary() {
  useOperatorAuth();

  const { file, previewData, error, handleFileChange, fileInputRef } = useJSONParser();

  const handleNext = () => {
    if (previewData && file) {
      saveJSONData(previewData.items, file.name);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          导入词库 - 步骤 1
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          仅支持 JSON 格式，需符合 CEFR 数据结构
        </p>
      </div>

      <FileInput
        ref={fileInputRef}
        onFileChange={handleFileChange}
        fileName={file?.name || null}
        recordCount={previewData?.items.length || null}
        error={error}
      />

      <div className="mt-6">
        <NextButton
          onClick={handleNext}
          disabled={!file || !previewData || previewData.items.length === 0}
        />
      </div>
    </div>
  );
}
