"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboard,
  type DayMetric,
  type DayRevenue,
} from "@/lib/api/operator";
import { useOperatorAuth } from "./hooks/useOperatorAuth";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { OperatorMain, OperatorPanel, OperatorStatBlock } from "./components/OperatorChrome";

const METRIC_HELP: Record<string, string> = {
  今日注册: "今天（按本地时区）新注册的用户数，来源于 Supabase Auth 的 created_at 字段。",
  总用户数: "系统中所有已注册用户的总数，包含已封禁用户。",
  今日复习量:
    "今天所有用户完成的卡片复习总次数，基于 account_cards 表中 repetitions > 0 且 updated_at 在今天范围内的记录。",
  今日收入:
    "今天状态为 paid 的订单金额总和（单位：元），基于 pay_orders 表的 amount_total 字段（存储单位为分）。",
  今日活跃:
    "今天至少复习过 1 张卡片的独立用户数（DAU），基于 account_cards 表中 updated_at 在今天且 repetitions > 0 的去重 account_id。",
  次日留存:
    "在所有激活用户（至少有 1 张卡片）中，在 2 个或以上不同日期进行过复习的用户占比。反映用户是否在注册后第二天还会回来。",
  "7日留存":
    "在所有激活用户中，在 7 个或以上不同日期进行过复习的用户占比。反映用户的长期粘性。",
  付费转化:
    "在所有激活用户中，至少有 1 笔已支付订单的用户占比。计算公式：付费用户数 / 激活用户数 × 100%。",
};

function MiniBarChart({
  data,
  maxHeight = 80,
  formatTooltip,
}: {
  data: { date: string; value: number }[];
  maxHeight?: number;
  /** Hover text for each bar; defaults to `日期: 数值`. */
  formatTooltip?: (d: { date: string; value: number }) => string;
}) {
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-20 items-end gap-px">
      {data.map((d) => {
        const h = Math.max((d.value / max) * maxHeight, d.value > 0 ? 2 : 0);
        const tip = formatTooltip
          ? formatTooltip(d)
          : `${d.date} · ${d.value}`;
        return (
          <div
            key={d.date}
            className="min-w-0 flex-1 cursor-default rounded-sm bg-primary/30 transition-colors hover:bg-primary/45"
            style={{ height: `${h}px` }}
            title={tip}
          />
        );
      })}
    </div>
  );
}

export default function OperatorDashboard() {
  useOperatorAuth();
  const offset = new Date().getTimezoneOffset();

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator-dashboard", offset],
    queryFn: () => fetchDashboard(offset),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <OperatorMain>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-muted/50 md:h-28"
            />
          ))}
        </div>
      </OperatorMain>
    );
  }

  if (error) {
    return (
      <OperatorMain>
        <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
      </OperatorMain>
    );
  }

  if (!data) return null;

  return (
    <OperatorMain>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <OperatorStatBlock
          label="今日注册"
          value={data.todayRegistrations}
          labelHint={METRIC_HELP["今日注册"]}
        />
        <OperatorStatBlock
          label="总用户数"
          value={data.totalUsers}
          labelHint={METRIC_HELP["总用户数"]}
        />
        <OperatorStatBlock
          label="今日复习量"
          value={data.todayReviews}
          labelHint={METRIC_HELP["今日复习量"]}
        />
        <OperatorStatBlock
          label="今日收入"
          value={`¥${(data.todayRevenue / 100).toFixed(2)}`}
          labelHint={METRIC_HELP["今日收入"]}
        />
        <OperatorStatBlock
          label="今日活跃"
          value={data.todayDAU}
          labelHint={METRIC_HELP["今日活跃"]}
        />
        <OperatorStatBlock
          label="次日留存"
          value={`${data.retention.nextDayRetention}%`}
          labelHint={METRIC_HELP["次日留存"]}
        />
        <OperatorStatBlock
          label="7日留存"
          value={`${data.retention.sevenDayRetention}%`}
          labelHint={METRIC_HELP["7日留存"]}
        />
        <OperatorStatBlock
          label="付费转化"
          value={`${data.retention.paidConversion}%`}
          labelHint={METRIC_HELP["付费转化"]}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TrendCard
          title="注册趋势 (30天)"
          data={data.trends.registrations}
          valueKey="count"
        />
        <TrendCard
          title="DAU 趋势 (30天)"
          data={data.trends.dau}
          valueKey="count"
        />
        <TrendCard
          title="复习趋势 (30天)"
          data={data.trends.reviews}
          valueKey="count"
        />
        <TrendCard
          title="收入趋势 (30天)"
          data={data.trends.revenue}
          valueKey="amount"
          formatValue={(v) => `¥${(v / 100).toFixed(0)}`}
        />
      </div>
    </OperatorMain>
  );
}

function TrendCard({
  title,
  data,
  valueKey,
  formatValue,
}: {
  title: string;
  data: (DayMetric | DayRevenue)[];
  valueKey: string;
  formatValue?: (v: number) => string;
}) {
  const values = data.map((d) => {
    if (valueKey === "amount" && "amount" in d) return d.amount;
    if (valueKey === "count" && "count" in d) return d.count;
    return 0;
  });
  const total = values.reduce((a, b) => a + b, 0);
  const displayTotal = formatValue ? formatValue(total) : String(total);

  const chartData = data.map((d) => ({
    date: d.date,
    value:
      valueKey === "amount" && "amount" in d
        ? d.amount
        : "count" in d
          ? d.count
          : 0,
  }));

  return (
    <OperatorPanel className="p-4 md:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {displayTotal}
        </span>
      </div>
      <MiniBarChart
        data={chartData}
        formatTooltip={(d) =>
          formatValue
            ? `${d.date} · ${formatValue(d.value)}`
            : `${d.date} · ${d.value}`
        }
      />
      <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </OperatorPanel>
  );
}
