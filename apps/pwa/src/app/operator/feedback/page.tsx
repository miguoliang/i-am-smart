"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFeedbacks } from "@/lib/api/feedback";
import { updateFeedback } from "@/lib/api/operator";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { DataTable, ColumnConfig } from "@/components/table/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Paginator } from "../components/Paginator";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { Feedback } from "@/lib/types/feedback";
import { Button } from "@/components/form/Button";
import { downloadCSV } from "@/lib/utils/csv";
import { Textarea } from "@/components/form/Textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/overlay/Dialog";
import { toast } from "sonner";
import { OperatorMain } from "../components/OperatorChrome";

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "id", label: "ID", visible: false },
  { key: "created_at", label: "提交时间", visible: true },
  { key: "status", label: "状态", visible: true },
  { key: "occupation", label: "职业", visible: true },
  { key: "willRecommend", label: "是否推荐", visible: true },
  { key: "openFeedback", label: "开放意见", visible: true },
  { key: "actions", label: "操作", visible: true },
];

const STORAGE_KEY = "feedback_table_columns";

export default function FeedbackPage() {
  useOperatorAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [note, setNote] = useState("");

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

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      status,
      operator_note,
    }: {
      id: string;
      status: "pending" | "resolved";
      operator_note?: string;
    }) => updateFeedback(id, { status, operator_note }),
    onSuccess: () => {
      toast.success("反馈状态已更新");
      void queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

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
        cell: ({ row }) => formatDate(row.getValue("created_at") as string),
      },
      {
        id: "status",
        header: "状态",
        cell: ({ row }) => {
          const status = row.original.status || "pending";
          return (
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                status === "resolved"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400"
              }`}
            >
              {status === "resolved" ? "已处理" : "待处理"}
            </span>
          );
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
          const fb = row.original;
          const isResolved = fb.status === "resolved";
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFeedback(fb);
                  setNote(fb.operator_note || "");
                  setDetailsOpen(true);
                }}
              >
                查看详情
              </Button>
              <Button
                variant={isResolved ? "outline" : "default"}
                size="sm"
                onClick={() =>
                  resolveMutation.mutate({
                    id: String(fb.id),
                    status: isResolved ? "pending" : "resolved",
                  })
                }
                disabled={resolveMutation.isPending}
              >
                {isResolved ? "重新打开" : "标记已处理"}
              </Button>
            </div>
          );
        },
      },
    ],
    [resolveMutation]
  );

  return (
    <OperatorMain>
      <DataTable
        data={feedbacks}
        columns={columns}
        loading={loading}
        error={error}
        toolbarLeft={
          <Button
            variant="outline"
            size="sm"
            disabled={feedbacks.length === 0 || loading}
            onClick={() =>
              downloadCSV(
                feedbacks.map((f) => ({
                  id: f.id,
                  status: f.status || "pending",
                  occupation: f.content.occupation || "",
                  willRecommend: f.content.willRecommend || "",
                  openFeedback: f.content.openFeedback || "",
                  operator_note: f.operator_note || "",
                  created_at: f.created_at,
                })),
                [
                  { key: "id", label: "ID" },
                  { key: "status", label: "状态" },
                  { key: "occupation", label: "职业" },
                  { key: "willRecommend", label: "是否推荐" },
                  { key: "openFeedback", label: "开放意见" },
                  { key: "operator_note", label: "运营备注" },
                  { key: "created_at", label: "提交时间" },
                ],
                `feedback-${new Date().toISOString().slice(0, 10)}`
              )
            }
          >
            导出 CSV
          </Button>
        }
        pagination={{ enabled: false }}
        columnSettings={{
          enabled: true,
          storageKey: STORAGE_KEY,
          defaultColumns: DEFAULT_COLUMNS,
        }}
        sorting={{ enabled: false }}
        emptyMessage="暂无反馈数据"
        refreshButton={{ onClick: () => refetch(), loading }}
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

      {/* Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>反馈详情</DialogTitle>
            <DialogDescription>
              提交时间:{" "}
              {selectedFeedback
                ? formatDate(selectedFeedback.created_at)
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1 text-sm text-muted-foreground">
                    用户ID
                  </h4>
                  <p className="font-mono text-sm">
                    {selectedFeedback.user_id || "匿名用户"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-sm text-muted-foreground">
                    职业
                  </h4>
                  <p>{selectedFeedback.content.occupation || "-"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">
                  学习目的
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFeedback.content.learningPurpose?.map((p, i) => (
                    <span
                      key={i}
                      className="bg-secondary px-2 py-1 rounded text-sm"
                    >
                      {p}
                    </span>
                  )) || "-"}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">
                  碎片时间利用是否有帮助
                </h4>
                <p>
                  {selectedFeedback.content.fragmentTimeHelpful === "yes"
                    ? "是"
                    : "否"}
                </p>
                {selectedFeedback.content.fragmentTimeHelpful === "no" && (
                  <p className="mt-1 text-sm text-red-500 bg-red-50 p-2 rounded">
                    原因:{" "}
                    {selectedFeedback.content.fragmentTimeNotHelpfulReason}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">
                  是否推荐给朋友
                </h4>
                <p>
                  {selectedFeedback.content.willRecommend === "yes"
                    ? "是"
                    : "否"}
                </p>
                {selectedFeedback.content.willRecommend === "no" && (
                  <p className="mt-1 text-sm text-red-500 bg-red-50 p-2 rounded">
                    原因: {selectedFeedback.content.notRecommendReason}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">
                  开放意见/建议
                </h4>
                <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                  {selectedFeedback.content.openFeedback || "无"}
                </div>
              </div>

              {/* Operator note */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                  运营备注
                </h4>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="添加备注..."
                  rows={3}
                  className="mb-3"
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resolveMutation.mutate({
                        id: String(selectedFeedback.id),
                        status: "pending",
                        operator_note: note,
                      });
                      setDetailsOpen(false);
                    }}
                    disabled={resolveMutation.isPending}
                  >
                    保存备注
                  </Button>
                  <Button
                    onClick={() => {
                      resolveMutation.mutate({
                        id: String(selectedFeedback.id),
                        status: "resolved",
                        operator_note: note,
                      });
                      setDetailsOpen(false);
                    }}
                    disabled={resolveMutation.isPending}
                  >
                    标记已处理并保存
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OperatorMain>
  );
}
