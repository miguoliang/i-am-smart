"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteKnowledge, fetchKnowledges, updateKnowledge, type Knowledge } from "@/lib/api/knowledge";
import { resolveKnowledgeErrorReportsByCode } from "@/lib/api/knowledgeErrorReports";
import { DataTable, ColumnConfig } from "@/components/table/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { Paginator } from "@/app/operator/components/Paginator";
import { Button } from "@/components/form/Button";
import { Input } from "@/components/form/Input";
import { Textarea } from "@/components/form/Textarea";
import { Label } from "@/components/form/Label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/overlay/Dialog";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { OperatorMain, OperatorPageHeader } from "../components/OperatorChrome";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "code", label: "代码", visible: true },
  { key: "name", label: "名称", visible: true },
  { key: "description", label: "描述", visible: true },
  { key: "level", label: "等级", visible: true },
  { key: "error_report", label: "纠错", visible: true },
  { key: "created_at", label: "创建时间", visible: true },
  { key: "actions", label: "操作", visible: true },
];

const STORAGE_KEY = "knowledges_table_columns_v3";
const DEFAULT_PAGE_SIZE = 10;
const DEBOUNCE_MS = 300;

export function KnowledgesPageClient() {
  useOperatorAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingReportsOnly = searchParams.get("pending") === "1";

  const setPendingReportsOnly = (value: boolean) => {
    setCurrentPage(1);
    router.replace(
      value ? "/operator/knowledges?pending=1" : "/operator/knowledges",
      { scroll: false }
    );
  };

  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [level, setLevel] = useState("");

  const [editItem, setEditItem] = useState<Knowledge | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Knowledge | null>(null);
  const [resolvingCode, setResolvingCode] = useState<string | null>(null);
  const editItemRef = useRef<Knowledge | null>(null);
  useEffect(() => {
    editItemRef.current = editItem;
  }, [editItem]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    data: paginatedResult,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [
      "knowledges",
      currentPage,
      DEFAULT_PAGE_SIZE,
      debouncedSearch,
      level,
      pendingReportsOnly,
    ],
    queryFn: () =>
      fetchKnowledges({
        page: currentPage,
        pageSize: DEFAULT_PAGE_SIZE,
        search: debouncedSearch || undefined,
        level: level || undefined,
        pendingReportsOnly,
      }),
  });

  const knowledges = paginatedResult?.data || [];
  const total = paginatedResult?.total || 0;
  const totalPages = paginatedResult?.totalPages || 0;
  const error = queryError ? getErrorMessage(queryError) : null;

  const editMutation = useMutation({
    mutationFn: ({ code, data }: { code: string; data: { name: string; description: string } }) =>
      updateKnowledge(code, data),
    onSuccess: () => {
      toast.success("已更新");
      setEditOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["knowledges"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteKnowledge(code),
    onSuccess: (_data, deletedCode) => {
      toast.success("已删除词条");
      setDeleteItem(null);
      if (editItemRef.current?.code === deletedCode) {
        setEditOpen(false);
        setEditItem(null);
      }
      void queryClient.invalidateQueries({ queryKey: ["knowledges"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const resolveReportsMutation = useMutation({
    mutationFn: (code: string) => resolveKnowledgeErrorReportsByCode(code),
    onMutate: (code) => {
      setResolvingCode(code);
    },
    onSuccess: (data) => {
      if (data.resolvedCount > 0) {
        toast.success("已标记纠错完成");
      } else {
        toast.message("暂无待处理的纠错记录");
      }
      void queryClient.invalidateQueries({ queryKey: ["knowledges"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => {
      setResolvingCode(null);
    },
  });

  const columns: ColumnDef<Knowledge>[] = [
    {
      accessorKey: "code",
      header: "代码",
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("code")}</span>,
    },
    {
      accessorKey: "name",
      header: "名称",
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "description",
      header: "描述",
      cell: ({ row }) => (
        <span className="block max-w-md truncate">{row.getValue("description")}</span>
      ),
    },
    {
      id: "level",
      header: "等级",
      cell: ({ row }) => {
        const lvl = row.original.level;
        return lvl ? (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
            {lvl}
          </span>
        ) : (
          "-"
        );
      },
    },
    {
      id: "error_report",
      header: "纠错",
      cell: ({ row }) => {
        const n = row.original.pending_error_report_count ?? 0;
        if (n < 1) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="inline-flex rounded border border-amber-500/40 px-2 py-0.5 text-xs text-amber-800 dark:text-amber-200">
            待处理{n > 1 ? `（${n}）` : ""}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "创建时间",
      cell: ({ row }) => formatDate(row.getValue("created_at") as string, "YYYY-MM-DD"),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        const k = row.original;
        const pending = (k.pending_error_report_count ?? 0) > 0;
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => {
                setEditItem(k);
                setEditName(k.name);
                setEditDesc(k.description || "");
                setEditOpen(true);
              }}
            >
              <Pencil className="h-3 w-3" /> 编辑
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1"
              onClick={() => setDeleteItem(k)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3 w-3" /> 删除
            </Button>
            {pending ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => resolveReportsMutation.mutate(k.code)}
                loading={resolvingCode === k.code}
                disabled={resolvingCode !== null}
              >
                完成纠错
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <OperatorMain>
      <OperatorPageHeader
        title="词库管理"
        description={
          <>
            维护词条；用户在学习页按{" "}
            <kbd className="rounded bg-muted px-1 font-mono text-xs">W</kbd>{" "}
            提交的纠错会在下表「纠错」列显示为待处理，修改词条后可点「完成纠错」。
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-border p-0.5">
          <button
            type="button"
            onClick={() => setPendingReportsOnly(false)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              !pendingReportsOnly
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            全部词条
          </button>
          <button
            type="button"
            onClick={() => setPendingReportsOnly(true)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              pendingReportsOnly
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            仅待纠错
          </button>
        </div>
        <Input
          type="search"
          placeholder="搜索单词或释义..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-64"
        />
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">全部等级</option>
          {CEFR_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={knowledges}
        columns={columns}
        loading={loading}
        error={error}
        pagination={{ enabled: false }}
        columnSettings={{
          enabled: true,
          storageKey: STORAGE_KEY,
          defaultColumns: DEFAULT_COLUMNS,
        }}
        sorting={{ enabled: false }}
        emptyMessage="暂无数据"
        refreshButton={{ onClick: () => refetch(), loading }}
      />

      {!loading && knowledges.length > 0 && (
        <div className="mt-4">
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages || 1}
            onPageChange={(page) => setCurrentPage(page)}
            itemsPerPage={DEFAULT_PAGE_SIZE}
            totalItems={total}
          />
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑单词</DialogTitle>
            <DialogDescription>修改 {editItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>名称</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>释义</Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (editItem) {
                  editMutation.mutate({
                    code: editItem.code,
                    data: { name: editName, description: editDesc },
                  });
                }
              }}
              loading={editMutation.isPending}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteItem !== null} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除词条</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  将永久删除{" "}
                  <span className="font-medium text-foreground">{deleteItem?.name}</span>（
                  <span className="font-mono text-xs">{deleteItem?.code}</span>）。
                </p>
                <p>用户在该词上的学习卡片与未结纠错记录会一并删除，且无法恢复。</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)} disabled={deleteMutation.isPending}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteItem) deleteMutation.mutate(deleteItem.code);
              }}
              loading={deleteMutation.isPending}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperatorMain>
  );
}
