"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSaasMetrics, fetchCompletionMetrics, type SaasMetrics, type CompletionMetrics } from "@/lib/api/operator";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`${color} text-white rounded-2xl p-4 md:p-6 text-center`}>
      <p className="text-2xl md:text-3xl font-bold">{value}</p>
      <p className="text-xs md:text-sm mt-1 opacity-90">{label}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

function CohortTable({ data }: { data: SaasMetrics["cohortRetention"] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无队列数据</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4">注册周</th>
            <th className="py-2 pr-4 text-right">人数</th>
            <th className="py-2 pr-4 text-right">D1</th>
            <th className="py-2 pr-4 text-right">D7</th>
            <th className="py-2 text-right">D30</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.cohort_week} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 pr-4 font-mono text-xs">{row.cohort_week.slice(5)}</td>
              <td className="py-2 pr-4 text-right">{row.cohort_size}</td>
              <td className="py-2 pr-4 text-right">
                <RetentionCell value={row.d1_retention} />
              </td>
              <td className="py-2 pr-4 text-right">
                <RetentionCell value={row.d7_retention} />
              </td>
              <td className="py-2 text-right">
                <RetentionCell value={row.d30_retention} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RetentionCell({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  const bg =
    value >= 40 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
    value >= 20 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
    value > 0 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
    "text-muted-foreground";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${bg}`}>
      {value}%
    </span>
  );
}

function CompletionSection({ data }: { data: CompletionMetrics }) {
  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">📊 核心指标</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6">
        <StatCard
          label="平均词库掌握率"
          value={`${data.overall.avgMasteredPct ?? 0}%`}
          color="bg-green-500"
        />
        <StatCard
          label="完成学习用户"
          value={`${data.overall.completedProfiles ?? 0} / ${data.overall.totalProfiles ?? 0}`}
          color="bg-blue-500"
        />
      </div>

      {data.byExam.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-8">
          <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400">按考试目标</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">考试目标</th>
                  <th className="py-2 pr-4 text-right">用户数</th>
                  <th className="py-2 pr-4 text-right">掌握率</th>
                  <th className="py-2 pr-4 text-right">已掌握</th>
                  <th className="py-2 text-right">总词数</th>
                </tr>
              </thead>
              <tbody>
                {data.byExam.map((row) => (
                  <tr key={row.exam_target} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 font-medium">{row.exam_target}</td>
                    <td className="py-2 pr-4 text-right">{row.profiles}</td>
                    <td className="py-2 pr-4 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        row.avg_mastered_pct >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                        row.avg_mastered_pct >= 50 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}>
                        {row.avg_mastered_pct}%
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right">{row.total_mastered}</td>
                    <td className="py-2 text-right">{row.total_cards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default function SaasMetricsPage() {
  useOperatorAuth();
  const offset = new Date().getTimezoneOffset();
  const [saasExpanded, setSaasExpanded] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator-saas-metrics", offset],
    queryFn: () => fetchSaasMetrics(offset),
    refetchInterval: 60_000,
  });

  const { data: completionData, isLoading: completionLoading, error: completionError } = useQuery({
    queryKey: ["operator-completion-metrics"],
    queryFn: fetchCompletionMetrics,
    refetchInterval: 60_000,
  });

  if (isLoading && completionLoading) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">指标概览</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && completionError) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">指标概览</h1>
        <p className="text-red-500">{getErrorMessage(error)}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <Link href="/operator" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          指标概览
        </h1>
      </div>

      {/* Core Metrics - Completion */}
      {completionLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : completionError ? (
        <p className="text-red-500 mb-8">{getErrorMessage(completionError)}</p>
      ) : completionData ? (
        <CompletionSection data={completionData} />
      ) : null}

      {/* SaaS Metrics - Collapsible */}
      {data && (
        <>
          <button
            onClick={() => setSaasExpanded(!saasExpanded)}
            className="flex items-center gap-2 text-xl font-bold mb-4 text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
          >
            {saasExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            📈 SaaS 运营指标
          </button>

          {saasExpanded && (
            <>
              {/* Active Users */}
      <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">用户活跃</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
        <StatCard label="DAU" value={data.activeUsers.dau} color="bg-blue-500" />
        <StatCard label="WAU" value={data.activeUsers.wau} color="bg-indigo-500" />
        <StatCard label="MAU" value={data.activeUsers.mau} color="bg-purple-500" />
        <StatCard
          label="DAU/MAU"
          value={`${data.activeUsers.dauMauRatio}%`}
          sub={data.activeUsers.dauMauRatio >= 20 ? "健康" : "偏低"}
          color="bg-teal-500"
        />
      </div>

      {/* Revenue & Subscription */}
      <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">收入</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
        <StatCard
          label="MRR"
          value={`¥${(data.mrr.currentMrr / 100).toFixed(0)}`}
          sub={`环比 ${data.mrr.momGrowth > 0 ? '+' : ''}${data.mrr.momGrowth}%`}
          color="bg-emerald-500"
        />
        <StatCard
          label="NRR"
          value={`${data.nrr.nrr}%`}
          sub={data.nrr.nrr >= 100 ? "健康" : "收缩"}
          color={data.nrr.nrr >= 100 ? "bg-green-500" : "bg-red-500"}
        />
        <StatCard
          label="LTV"
          value={`¥${(data.ltv.ltv / 100).toFixed(0)}`}
          sub={`月流失 ${data.ltv.monthlyChurnRate}%`}
          color="bg-violet-500"
        />
        <StatCard
          label="ARPPU"
          value={`¥${(data.arppu.arppu / 100).toFixed(0)}`}
          sub={`${data.arppu.payingUsers} 付费用户`}
          color="bg-amber-500"
        />
      </div>

      {/* Churn */}
      <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">流失率</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
        <StatCard
          label="周流失率"
          value={`${data.churn.weeklyChurnRate}%`}
          sub={`${data.churn.weeklyChurned}/${data.churn.weeklyActiveBase}`}
          color="bg-orange-500"
        />
        <StatCard
          label="月流失率"
          value={`${data.churn.monthlyChurnRate}%`}
          sub={`${data.churn.monthlyChurned}/${data.churn.monthlyActiveBase}`}
          color="bg-red-500"
        />
        <StatCard
          label="ARPPU (月)"
          value={`¥${(data.arppu.monthlyArppu / 100).toFixed(2)}`}
          sub={`${data.arppu.monthlyPayingUsers} 付费用户`}
          color="bg-green-500"
        />
        <StatCard
          label="转化率"
          value={`—`}
          sub="见主仪表盘"
          color="bg-gray-500"
        />
      </div>

      {/* Cohort Retention */}
      <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">队列留存</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-8">
        <CohortTable data={data.cohortRetention} />
      </div>

      {/* NPS & Growth */}
      <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">用户满意度 & 增长</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
        <StatCard
          label="NPS"
          value={data.nps.nps}
          sub={`${data.nps.total} 份评分`}
          color={data.nps.nps >= 50 ? "bg-green-500" : data.nps.nps >= 0 ? "bg-yellow-500" : "bg-red-500"}
        />
        <StatCard
          label="平均评分"
          value={data.nps.avgScore}
          sub={`推荐 ${data.nps.promoters} / 中立 ${data.nps.passives} / 贬损 ${data.nps.detractors}`}
          color="bg-blue-500"
        />
        <StatCard
          label="K-factor"
          value={data.kfactor.kfactor}
          sub={data.kfactor.kfactor >= 1 ? "病毒增长 🚀" : `${data.kfactor.convertedInvites}/${data.kfactor.totalInvites} 转化`}
          color={data.kfactor.kfactor >= 1 ? "bg-green-500" : "bg-indigo-500"}
        />
        <StatCard
          label="邀请转化率"
          value={`${data.kfactor.conversionRate}%`}
          sub={`${data.kfactor.usersWhoInvited} 人发起邀请`}
          color="bg-purple-500"
        />
      </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
