"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchContactMessages, fetchContactAttachmentSignedUrls } from "@/lib/api/contactMessages";
import { updateContactMessage } from "@/lib/api/operator";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { DataTable, ColumnConfig } from "@/components/table/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Paginator } from "../components/Paginator";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import type { ContactMessage } from "@/lib/types/contactMessage";
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
  { key: "body", label: "留言", visible: true },
  { key: "attachment_count", label: "附件", visible: true },
  { key: "contact_hint", label: "联系方式", visible: true },
  { key: "user_id", label: "用户ID", visible: false },
  { key: "actions", label: "操作", visible: true },
];

const STORAGE_KEY = "contact_messages_table_columns";

export default function ContactMessagesPage() {
  useOperatorAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [note, setNote] = useState("");

  const { data: attachmentUrls = {} } = useQuery({
    queryKey: ["contact-attachment-signed-urls", selected?.id, detailsOpen],
    queryFn: async () => {
      if (!selected?.attachments?.length) {
        return {} as Record<string, string>;
      }
      try {
        return await fetchContactAttachmentSignedUrls(
          selected.attachments.map((a) => a.path)
        );
      } catch (e) {
        toast.error(getErrorMessage(e));
        return {} as Record<string, string>;
      }
    },
    enabled: Boolean(detailsOpen && selected?.attachments?.length),
  });

  const {
    data: listData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["contact-messages", currentPage, perPage],
    queryFn: () => fetchContactMessages(currentPage, perPage),
  });

  const messages = listData?.data || [];
  const total = listData?.total || 0;
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
    }) => updateContactMessage(id, { status, operator_note }),
    onSuccess: () => {
      toast.success("留言状态已更新");
      void queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns = useMemo<ColumnDef<ContactMessage>[]>(
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
        accessorKey: "body",
        header: "留言",
        cell: ({ row }) => {
          const text = row.original.body;
          return (
            <span className="truncate max-w-[240px] block" title={text}>
              {text}
            </span>
          );
        },
      },
      {
        id: "attachment_count",
        header: "附件",
        cell: ({ row }) => {
          const n = row.original.attachments?.length ?? 0;
          return <span>{n > 0 ? `${n} 个` : "—"}</span>;
        },
      },
      {
        accessorKey: "contact_hint",
        header: "联系方式",
        cell: ({ row }) => {
          const h = row.original.contact_hint;
          if (!h) return <span className="text-muted-foreground">-</span>;
          return (
            <span className="truncate max-w-[160px] block" title={h}>
              {h}
            </span>
          );
        },
      },
      {
        accessorKey: "user_id",
        header: "用户ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs truncate max-w-[120px] block">
            {(row.getValue("user_id") as string) || "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "操作",
        cell: ({ row }) => {
          const m = row.original;
          const isResolved = m.status === "resolved";
          return (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(m);
                  setNote(m.operator_note || "");
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
                    id: String(m.id),
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
        data={messages}
        columns={columns}
        loading={loading}
        error={error}
        toolbarLeft={
          <Button
            variant="outline"
            size="sm"
            disabled={messages.length === 0 || loading}
            onClick={() =>
              downloadCSV(
                messages.map((m) => ({
                  id: m.id,
                  status: m.status || "pending",
                  body: m.body,
                  attachment_paths: (m.attachments ?? []).map((a) => a.path).join("; "),
                  contact_hint: m.contact_hint || "",
                  user_id: m.user_id,
                  operator_note: m.operator_note || "",
                  created_at: m.created_at,
                })),
                [
                  { key: "id", label: "ID" },
                  { key: "status", label: "状态" },
                  { key: "body", label: "留言" },
                  { key: "attachment_paths", label: "附件路径" },
                  { key: "contact_hint", label: "联系方式" },
                  { key: "user_id", label: "用户ID" },
                  { key: "operator_note", label: "运营备注" },
                  { key: "created_at", label: "提交时间" },
                ],
                `contact-messages-${new Date().toISOString().slice(0, 10)}`
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
        emptyMessage="暂无用户留言"
        refreshButton={{ onClick: () => refetch(), loading }}
      />

      {!loading && messages.length > 0 && (
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
            <DialogTitle>留言详情</DialogTitle>
            <DialogDescription>
              提交时间:{" "}
              {selected ? formatDate(selected.created_at) : ""}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">用户ID</h4>
                <p className="font-mono text-sm break-all">{selected.user_id}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">联系方式</h4>
                <p className="text-sm">{selected.contact_hint || "（未填写）"}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm text-muted-foreground">留言内容</h4>
                <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">{selected.body}</div>
              </div>

              {selected.attachments && selected.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">附件</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selected.attachments.map((a) => {
                      const url = attachmentUrls[a.path];
                      return (
                        <div key={a.path} className="rounded-md border border-border overflow-hidden bg-muted/30 p-2">
                          {!url ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">加载中…</p>
                          ) : a.mime_type.startsWith("video/") ? (
                            <video
                              src={url}
                              controls
                              className="max-h-56 w-full rounded bg-black"
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs
                            <img
                              src={url}
                              alt=""
                              className="max-h-56 w-full object-contain rounded"
                              loading="lazy"
                            />
                          )}
                          <p className="text-xs text-muted-foreground mt-2 truncate" title={a.path}>
                            {a.mime_type} · {(a.size_bytes / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">运营备注</h4>
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
                        id: String(selected.id),
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
                        id: String(selected.id),
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
