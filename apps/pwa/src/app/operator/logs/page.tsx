"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { DataTable } from "@/components/table/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Paginator } from "../components/Paginator";
import { formatDate } from "@/lib/utils/dateUtils";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { OperatorMain } from "../components/OperatorChrome";
import { parseApiErrorResponse } from "@/lib/utils/apiError";

const PER_PAGE = 20;

const ACTION_LABELS: Record<string, string> = {
  ban_user: "封禁用户",
  unban_user: "解封用户",
  push_broadcast: "推送通知",
  update_knowledge: "编辑词条",
  delete_knowledge: "删除词条",
};

interface AuditLog {
  id: number;
  operator_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

async function fetchLogs(page: number, perPage: number) {
  const res = await fetch(`/api/operator/logs?page=${page}&perPage=${perPage}`);
  if (!res.ok) {
    const msg = await parseApiErrorResponse(res, "获取日志失败");
    throw new Error(msg);
  }
  const json = await res.json();
  return json.data as { logs: AuditLog[]; total: number };
}

export default function LogsPage() {
  useOperatorAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator-logs", page],
    queryFn: () => fetchLogs(page, PER_PAGE),
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "时间",
        cell: ({ row }) => formatDate(row.getValue("created_at") as string),
      },
      {
        accessorKey: "action",
        header: "操作",
        cell: ({ row }) => {
          const action = row.getValue("action") as string;
          return ACTION_LABELS[action] || action;
        },
      },
      {
        accessorKey: "target_type",
        header: "目标类型",
        cell: ({ row }) => row.getValue("target_type") || "-",
      },
      {
        accessorKey: "target_id",
        header: "目标ID",
        cell: ({ row }) => {
          const id = row.getValue("target_id") as string | null;
          return id ? (
            <span className="font-mono text-xs">{id.length > 12 ? `${id.slice(0, 12)}…` : id}</span>
          ) : "-";
        },
      },
      {
        accessorKey: "detail",
        header: "详情",
        cell: ({ row }) => {
          const detail = row.original.detail;
          if (!detail) return "-";
          const str = JSON.stringify(detail);
          return (
            <span className="text-xs text-muted-foreground truncate max-w-[200px] block" title={str}>
              {str.length > 60 ? str.slice(0, 60) + "…" : str}
            </span>
          );
        },
      },
      {
        accessorKey: "operator_id",
        header: "操作员",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {(row.getValue("operator_id") as string).slice(0, 8)}…
          </span>
        ),
      },
    ],
    []
  );

  return (
    <OperatorMain>
      <DataTable
        data={logs}
        columns={columns}
        loading={isLoading}
        error={error ? getErrorMessage(error) : null}
        pagination={{ enabled: false }}
        sorting={{ enabled: false }}
        emptyMessage="暂无操作日志"
      />

      {!isLoading && total > 0 && (
        <div className="mt-4">
          <Paginator
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={PER_PAGE}
            totalItems={total}
          />
        </div>
      )}
    </OperatorMain>
  );
}
