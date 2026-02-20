"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOrders, type OrderRow } from "@/lib/api/operator";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { DataTable } from "@/components/table/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Paginator } from "../import/components/Paginator";
import { Button } from "@/components/form/Button";
import { formatDate } from "@/lib/utils/dateUtils";
import { getErrorMessage } from "@/lib/utils/errorUtils";

const PER_PAGE = 20;

const statusBadgeClass: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  const className =
    statusBadgeClass[status] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${className}`}
    >
      {status === "pending" ? "待支付" : status === "paid" ? "已支付" : status === "failed" ? "失败" : status}
    </span>
  );
}

export default function OperatorOrdersPage() {
  useOperatorAuth();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"pending" | "paid" | "failed" | "all">("all");
  const [channel, setChannel] = useState<"wechat" | "alipay" | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["operator-orders", page, PER_PAGE, status, channel, startDate, endDate],
    queryFn: () =>
      fetchOrders({
        page,
        perPage: PER_PAGE,
        status,
        channel,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const summary = data?.summary ?? { totalAmount: 0, count: 0 };
  const error = queryError ? getErrorMessage(queryError) : null;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const columns = useMemo<ColumnDef<OrderRow>[]>(
    () => [
      {
        accessorKey: "out_trade_no",
        header: "订单号",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.getValue("out_trade_no")}</span>
        ),
      },
      {
        accessorKey: "account_id",
        header: "用户",
        cell: ({ row }) => {
          const id = row.getValue("account_id") as string | null;
          return (
            <span className="text-muted-foreground font-mono text-xs">
              {id ? `${id.slice(0, 8)}…` : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "amount_total",
        header: "金额",
        cell: ({ row }) => {
          const amount = row.getValue("amount_total") as number;
          return <span className="font-medium">¥{(amount / 100).toFixed(2)}</span>;
        },
      },
      {
        accessorKey: "channel",
        header: "支付方式",
        cell: ({ row }) => {
          const ch = row.getValue("channel") as string | null;
          return (
            <span>
              {ch === "wechat" ? "微信" : ch === "alipay" ? "支付宝" : ch ?? "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "状态",
        cell: ({ row }) => <StatusBadge status={row.getValue("status") as string} />,
      },
      {
        accessorKey: "created_at",
        header: "创建时间",
        cell: ({ row }) => formatDate(row.getValue("created_at") as string),
      },
      {
        accessorKey: "paid_at",
        header: "支付时间",
        cell: ({ row }) => {
          const paidAt = row.getValue("paid_at") as string | null;
          return paidAt ? formatDate(paidAt) : "-";
        },
      },
    ],
    []
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          订单管理
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          查看和筛选支付订单
        </p>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="mb-4 flex flex-wrap items-center gap-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            当前筛选共 <strong className="text-foreground">{summary.count}</strong> 笔订单
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            收入合计 <strong className="text-foreground">¥{(summary.totalAmount / 100).toFixed(2)}</strong>
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "pending" | "paid" | "failed" | "all");
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">全部状态</option>
          <option value="pending">待支付</option>
          <option value="paid">已支付</option>
          <option value="failed">失败</option>
        </select>
        <select
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value as "wechat" | "alipay" | "all");
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">全部渠道</option>
          <option value="wechat">微信</option>
          <option value="alipay">支付宝</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <span className="text-muted-foreground text-sm">至</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStartDate("");
            setEndDate("");
            setStatus("all");
            setChannel("all");
            setPage(1);
          }}
        >
          重置筛选
        </Button>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        error={error}
        pagination={{ enabled: false }}
        sorting={{ enabled: true }}
        emptyMessage="暂无订单"
        refreshButton={{
          onClick: () => refetch(),
          loading: loading,
        }}
      />

      {!loading && total > 0 && (
        <div className="mt-4">
          <Paginator
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
            itemsPerPage={PER_PAGE}
            totalItems={total}
          />
        </div>
      )}
    </div>
  );
}
