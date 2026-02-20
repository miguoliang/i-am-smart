"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboard,
  type DayMetric,
  type DayRevenue,
} from "@/lib/api/operator";
import { useOperatorAuth } from "./hooks/useOperatorAuth";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { Info, X } from "lucide-react";

const METRIC_HELP: Record<string, string> = {
  今日注册: "今天（按本地时区）新注册的用户数，来源于 Supabase Auth 的 created_at 字段。",
  总用户数: "系统中所有已注册用户的总数，包含已封禁用户。",
  今日复习量: "今天所有用户完成的卡片复习总次数，基于 account_cards 表中 repetitions > 0 且 updated_at 在今天范围内的记录。",
  今日收入: "今天状态为 paid 的订单金额总和（单位：元），基于 pay_orders 表的 amount_total 字段（存储单位为分）。",
  今日活跃: "今天至少复习过 1 张卡片的独立用户数（DAU），基于 account_cards 表中 updated_at 在今天且 repetitions > 0 的去重 account_id。",
  次日留存: "在所有激活用户（至少有 1 张卡片）中，在 2 个或以上不同日期进行过复习的用户占比。反映用户是否在注册后第二天还会回来。",
  "7日留存": "在所有激活用户中，在 7 个或以上不同日期进行过复习的用户占比。反映用户的长期粘性。",
  付费转化: "在所有激活用户中，至少有 1 笔已支付订单的用户占比。计算公式：付费用户数 / 激活用户数 × 100%。",
};

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const help = METRIC_HELP[label];

  return (
    <div className={`${color} text-white rounded-2xl p-4 md:p-6 text-center relative`}>
      {help && (
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="absolute top-2 right-2 opacity-60 hover:opacity-100 transition-opacity"
          aria-label={`${label}说明`}
        >
          {showHelp ? <X size={14} /> : <Info size={14} />}
        </button>
      )}
      {showHelp ? (
        <p className="text-xs leading-relaxed text-white/90 text-left px-1 py-2">
          {help}
        </p>
      ) : (
        <>
          <p className="text-2xl md:text-4xl font-bold">{value}</p>
          <p className="text-xs md:text-sm mt-1 md:mt-2 opacity-90">{label}</p>
        </>
      )}
    </div>
  );
}

function MiniBarChart({
  data,
  maxHeight = 80,
}: {
  data: { date: string; value: number }[];
  maxHeight?: number;
}) {
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-[2px] h-20">
      {data.map((d) => {
        const h = Math.max((d.value / max) * maxHeight, d.value > 0 ? 2 : 0);
        return (
          <div
            key={d.date}
            className="flex-1 bg-blue-500 dark:bg-blue-400 rounded-t-sm hover:bg-blue-600 transition-colors"
            style={{ height: `${h}px` }}
            title={`${d.date}: ${d.value}`}
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
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">仪表盘</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">仪表盘</h1>
        <p className="text-red-500">{getErrorMessage(error)}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8">
        仪表盘
      </h1>

      {/* Metric cards - row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
        <MetricCard
          label="今日注册"
          value={data.todayRegistrations}
          color="bg-blue-500"
        />
        <MetricCard
          label="总用户数"
          value={data.totalUsers}
          color="bg-indigo-500"
        />
        <MetricCard
          label="今日复习量"
          value={data.todayReviews}
          color="bg-green-500"
        />
        <MetricCard
          label="今日收入"
          value={`¥${(data.todayRevenue / 100).toFixed(2)}`}
          color="bg-amber-500"
        />
      </div>

      {/* Metric cards - row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
        <MetricCard
          label="今日活跃"
          value={data.todayDAU}
          color="bg-teal-500"
        />
        <MetricCard
          label="次日留存"
          value={`${data.retention.nextDayRetention}%`}
          color="bg-purple-500"
        />
        <MetricCard
          label="7日留存"
          value={`${data.retention.sevenDayRetention}%`}
          color="bg-pink-500"
        />
        <MetricCard
          label="付费转化"
          value={`${data.retention.paidConversion}%`}
          color="bg-rose-500"
        />
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <TrendCard title="注册趋势 (30天)" data={data.trends.registrations} valueKey="count" />
        <TrendCard title="DAU 趋势 (30天)" data={data.trends.dau} valueKey="count" />
        <TrendCard title="复习趋势 (30天)" data={data.trends.reviews} valueKey="count" />
        <TrendCard
          title="收入趋势 (30天)"
          data={data.trends.revenue}
          valueKey="amount"
          formatValue={(v) => `¥${(v / 100).toFixed(0)}`}
        />
      </div>
    </div>
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
    value: valueKey === "amount" && "amount" in d ? d.amount : "count" in d ? d.count : 0,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        <span className="text-lg font-bold">{displayTotal}</span>
      </div>
      <MiniBarChart data={chartData} />
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
