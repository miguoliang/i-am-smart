"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchKnowledges,
  updateKnowledge,
  deleteKnowledge,
  deleteKnowledgeBatch,
  type Knowledge,
} from "@/lib/api/knowledge";
import { DataTable, ColumnConfig } from "@/components/table/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { Paginator } from "@/app/operator/import/components/Paginator";
import { Button } from "@/components/form/Button";
import { Input } from "@/components/form/Input";
import { Textarea } from "@/components/form/Textarea";
import { Label } from "@/components/form/Label";
import { Checkbox } from "@/components/form/Checkbox";
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

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "select", label: "", visible: true },
  { key: "code", label: "代码", visible: true },
  { key: "name", label: "名称", visible: true },
  { key: "description", label: "描述", visible: true },
  { key: "level", label: "等级", visible: true },
  { key: "created_at", label: "创建时间", visible: true },
  { key: "actions", label: "操作", visible: true },
];

const STORAGE_KEY = "knowledges_table_columns";
const DEFAULT_PAGE_SIZE = 10;
const DEBOUNCE_MS = 300;

export default function KnowledgesPage() {
  useOperatorAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [level, setLevel] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Edit dialog
  const [editItem, setEditItem] = useState<Knowledge | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    queryKey: ["knowledges", currentPage, DEFAULT_PAGE_SIZE, debouncedSearch, level],
    queryFn: () =>
      fetchKnowledges({
        page: currentPage,
        pageSize: DEFAULT_PAGE_SIZE,
        search: debouncedSearch || undefined,
        level: level || undefined,
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
    onSuccess: () => {
      toast.success("已删除");
      setDeleteOpen(false);
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["knowledges"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (codes: string[]) => deleteKnowledgeBatch(codes),
    onSuccess: () => {
      toast.success(`已删除 ${selected.size} 条`);
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ["knowledges"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleSelect = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === knowledges.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(knowledges.map((k) => k.code)));
    }
  };

  const columns = useMemo<ColumnDef<Knowledge>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={knowledges.length > 0 && selected.size === knowledges.length}
            onCheckedChange={toggleAll}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selected.has(row.original.code)}
            onCheckedChange={() => toggleSelect(row.original.code)}
          />
        ),
      },
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
          <span className="max-w-md truncate block">{row.getValue("description")}</span>
        ),
      },
      {
        id: "level",
        header: "等级",
        cell: ({ row }) => {
          const lvl = (row.original.metadata as Record<string, unknown>)?.level as string;
          return lvl ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
              {lvl}
            </span>
          ) : (
            "-"
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
          return (
            <div className="flex items-center gap-2">
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
                variant="outline"
                size="sm"
                className="gap-1 text-red-500 hover:text-red-600"
                onClick={() => {
                  setDeleteTarget(k.code);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-3 w-3" /> 删除
              </Button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [knowledges, selected]
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">单词列表</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">查看和管理所有知识条目</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
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
        {selected.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => batchDeleteMutation.mutate(Array.from(selected))}
            loading={batchDeleteMutation.isPending}
          >
            批量删除 ({selected.size})
          </Button>
        )}
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

      {/* Edit Dialog */}
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

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>删除后不可恢复，确定要删除吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget);
              }}
              loading={deleteMutation.isPending}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
