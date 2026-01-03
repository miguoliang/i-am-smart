"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFeedbacks } from "@/lib/api/feedback";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { DataTable, ColumnConfig } from "@/components/Table";
import { ColumnDef } from "@tanstack/react-table";
import { Paginator } from "../import/components/Paginator";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { Feedback } from "@/lib/types/feedback";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// 默认列配置
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "id", label: "ID", visible: false },
  { key: "created_at", label: "提交时间", visible: true },
  { key: "occupation", label: "职业", visible: true },
  { key: "willRecommend", label: "是否推荐", visible: true },
  { key: "openFeedback", label: "开放意见", visible: true },
  { key: "actions", label: "操作", visible: true },
];

const STORAGE_KEY = "feedback_table_columns";

export default function FeedbackPage() {
  useOperatorAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    data: feedbackData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["feedbacks", currentPage, perPage],
    queryFn: () => fetchFeedbacks(currentPage, perPage),
  });

  const feedbacks = feedbackData?.data || [];
  const total = feedbackData?.total || 0;
  const totalPages = Math.ceil(total / perPage);
  const error = queryError ? getErrorMessage(queryError) : null;

  // 定义列
  const columns = useMemo<ColumnDef<Feedback>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.getValue("id")}</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "提交时间",
        cell: ({ row }) => {
          const date = row.getValue("created_at") as string;
          return formatDate(date);
        },
      },
      {
        accessorKey: "content.occupation",
        header: "职业",
        cell: ({ row }) => row.original.content.occupation || "-",
      },
      {
        accessorKey: "content.willRecommend",
        header: "是否推荐",
        cell: ({ row }) => {
          const val = row.original.content.willRecommend;
          return val === "yes" ? (
            <span className="text-green-600 font-medium">推荐</span>
          ) : val === "no" ? (
            <span className="text-red-500 font-medium">不推荐</span>
          ) : (
            "-"
          );
        },
      },
      {
        accessorKey: "content.openFeedback",
        header: "开放意见",
        cell: ({ row }) => {
          const text = row.original.content.openFeedback || "";
          if (!text) return <span className="text-muted-foreground">-</span>;
          return (
            <span className="truncate max-w-[200px] block" title={text}>
              {text}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "操作",
        cell: ({ row }) => {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFeedback(row.original);
                setDetailsOpen(true);
              }}
            >
              查看详情
            </Button>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          用户反馈
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          查看用户提交的反馈和建议
        </p>
      </div>

      <DataTable
        data={feedbacks}
        columns={columns}
        loading={loading}
        error={error}
        pagination={{ enabled: false }}
        columnSettings={{
          enabled: true,
          storageKey: STORAGE_KEY,
          defaultColumns: DEFAULT_COLUMNS,
        }}
        sorting={{ enabled: false }} // server-side sort implied
        emptyMessage="暂无反馈数据"
        refreshButton={{
          onClick: () => refetch(),
          loading: loading,
        }}
      />

      {!loading && feedbacks.length > 0 && (
        <div className="mt-4">
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages || 1}
            onPageChange={(page) => setCurrentPage(page)}
            itemsPerPage={perPage}
            totalItems={total}
          />
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>反馈详情</DialogTitle>
            <DialogDescription>
              提交时间: {selectedFeedback ? formatDate(selectedFeedback.created_at) : ""}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1 text-sm text-muted-foreground">用户ID</h4>
                  <p className="font-mono text-sm">{selectedFeedback.user_id || "匿名用户"}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-sm text-muted-foreground">职业</h4>
                  <p>{selectedFeedback.content.occupation || "-"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">学习目的</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFeedback.content.learningPurpose?.map((p, i) => (
                    <span key={i} className="bg-secondary px-2 py-1 rounded text-sm">
                      {p}
                    </span>
                  )) || "-"}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">碎片时间利用是否有帮助</h4>
                <p>
                  {selectedFeedback.content.fragmentTimeHelpful === "yes" ? "是" : "否"}
                </p>
                {selectedFeedback.content.fragmentTimeHelpful === "no" && (
                  <p className="mt-1 text-sm text-red-500 bg-red-50 p-2 rounded">
                    原因: {selectedFeedback.content.fragmentTimeNotHelpfulReason}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">是否推荐给朋友</h4>
                <p>
                  {selectedFeedback.content.willRecommend === "yes" ? "是" : "否"}
                </p>
                {selectedFeedback.content.willRecommend === "no" && (
                  <p className="mt-1 text-sm text-red-500 bg-red-50 p-2 rounded">
                    原因: {selectedFeedback.content.notRecommendReason}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">开放意见/建议</h4>
                <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                  {selectedFeedback.content.openFeedback || "无"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
