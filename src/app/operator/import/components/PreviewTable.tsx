"use client";

import { useMemo } from "react";
import { CefrKnowledgeItem } from "@/lib/api/import";
import { DataTable, ColumnConfig } from "@/components/Table";
import { ColumnDef } from "@tanstack/react-table";

interface PreviewTableProps {
  items: CefrKnowledgeItem[];
}

// 默认列配置
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "englishWord", label: "单词", visible: true },
  { key: "chineseTranslation", label: "翻译", visible: true },
  { key: "pos", label: "词性", visible: true },
  { key: "level", label: "等级", visible: true },
  { key: "exampleSentence", label: "例句", visible: true },
];

const STORAGE_KEY = "import_preview_table_columns";

export function PreviewTable({ items }: PreviewTableProps) {
  // 定义列
  const columns = useMemo<ColumnDef<CefrKnowledgeItem>[]>(
    () => [
      {
        accessorKey: "englishWord",
        header: "单词",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("englishWord") || "-"}</span>
        ),
      },
      {
        accessorKey: "chineseTranslation",
        header: "翻译",
        cell: ({ row }) => row.getValue("chineseTranslation") || "-",
      },
      {
        accessorKey: "pos",
        header: "词性",
        cell: ({ row }) => row.getValue("pos") || "-",
      },
      {
        accessorKey: "level",
        header: "等级",
        cell: ({ row }) => row.getValue("level") || "-",
      },
      {
        accessorKey: "exampleSentence",
        header: "例句",
        cell: ({ row }) => (
          <span className="max-w-md block">{row.getValue("exampleSentence") || "-"}</span>
        ),
      },
    ],
    []
  );

  return (
    <div className="mb-6 md:mb-8">
      <DataTable
        data={items}
        columns={columns}
        loading={false}
        error={null}
        pagination={{ enabled: true, pageSize: 10 }}
        columnSettings={{
          enabled: true,
          storageKey: STORAGE_KEY,
          defaultColumns: DEFAULT_COLUMNS,
        }}
        sorting={{ enabled: true }}
        emptyMessage="暂无数据"
      />
    </div>
  );
}

