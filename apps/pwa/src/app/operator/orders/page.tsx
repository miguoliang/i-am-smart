"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOrders, type OrderRow } from "@/lib/api/operator";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { DataTable } from "@/components/table/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Paginator } from "../components/Paginator";
import { Button } from "@/components/form/Button";
import { downloadCSV } from "@/lib/utils/csv";
import { formatDate } from "@/lib/utils/dateUtils";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { OperatorMain } from "../components/OperatorChrome";

const PER_PAGE = 20;

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "pending"
      ? "待支付"
      : status === "paid"
        ? "已支付"
        : status === "failed"
          ? "失败"
          : status;
  const tone =
    status === "failed"
      ? "border-destructive/30 text-destructive"
      : status === "paid"
        ? "border-border text-foreground"
        : "border-border text-muted-foreground";
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium tabular-nums ${tone}`}
    >
      {label}
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
        accessorKey: "pay_channel",
        header: "支付方式",
        cell: ({ row }) => {
          const ch = row.getValue("pay_channel") as string | null;
          if (!ch) return "-";
          if (ch.startsWith("wechat")) return "微信";
          if (ch.startsWith("alipay")) return "支付宝";
          return ch;
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
    <OperatorMain>
      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        error={error}
        toolbarLeft={
          <>
            {!loading && (
              <>
                <span className="text-sm text-muted-foreground">
                  共{" "}
                  <strong className="font-medium text-foreground">{summary.count}</strong>{" "}
                  笔 · 收入{" "}
                  <strong className="font-medium tabular-nums text-foreground">
                    ¥{(summary.totalAmount / 100).toFixed(2)}
                  </strong>
                </span>
                <span
                  className="hidden h-6 w-px shrink-0 bg-border sm:inline-block"
                  aria-hidden
                />
              </>
            )}
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
        <Button
          variant="outline"
          size="sm"
          disabled={orders.length === 0 || loading}
          onClick={() =>
            downloadCSV(
              orders as unknown as Record<string, unknown>[],
              [
                { key: "out_trade_no", label: "订单号" },
                { key: "account_id", label: "用户ID" },
                { key: "amount_total", label: "金额(分)" },
                { key: "pay_channel", label: "支付方式" },
                { key: "status", label: "状态" },
                { key: "created_at", label: "创建时间" },
                { key: "paid_at", label: "支付时间" },
              ],
              `orders-${new Date().toISOString().slice(0, 10)}`
            )
          }
        >
          导出 CSV
        </Button>
          </>
        }
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
    </OperatorMain>
  );
}
