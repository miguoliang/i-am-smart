"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchSaasMetrics,
  fetchCompletionMetrics,
  type SaasMetrics,
  type CompletionMetrics,
} from "@/lib/api/operator";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  OperatorMain,
  OperatorPageHeader,
  OperatorPanel,
  OperatorStatBlock,
} from "../components/OperatorChrome";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
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
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2.5 pr-4 font-medium">注册周</th>
            <th className="py-2.5 pr-4 text-right font-medium">人数</th>
            <th className="py-2.5 pr-4 text-right font-medium">D1</th>
            <th className="py-2.5 pr-4 text-right font-medium">D7</th>
            <th className="py-2.5 text-right font-medium">D30</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.cohort_week} className="border-b border-border/60">
              <td className="py-2.5 pr-4 font-mono text-xs tabular-nums">
                {row.cohort_week.slice(5)}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {row.cohort_size}
              </td>
              <td className="py-2.5 pr-4 text-right">
                <RetentionCell value={row.d1_retention} />
              </td>
              <td className="py-2.5 pr-4 text-right">
                <RetentionCell value={row.d7_retention} />
              </td>
              <td className="py-2.5 text-right">
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
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <span className="tabular-nums">{value}%</span>;
}

function CompletionSection({ data }: { data: CompletionMetrics }) {
  return (
    <>
      <SectionLabel>核心指标</SectionLabel>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
        <OperatorStatBlock
          label="平均词库掌握率"
          value={`${data.overall.avgMasteredPct ?? 0}%`}
        />
        <OperatorStatBlock
          label="完成学习用户"
          value={`${data.overall.completedProfiles ?? 0} / ${data.overall.totalProfiles ?? 0}`}
        />
      </div>

      {data.byExam.length > 0 && (
        <OperatorPanel className="mb-8 p-4 md:p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            按考试目标
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2.5 pr-4 font-medium">考试目标</th>
                  <th className="py-2.5 pr-4 text-right font-medium">用户数</th>
                  <th className="py-2.5 pr-4 text-right font-medium">掌握率</th>
                  <th className="py-2.5 pr-4 text-right font-medium">已掌握</th>
                  <th className="py-2.5 text-right font-medium">总词数</th>
                </tr>
              </thead>
              <tbody>
                {data.byExam.map((row) => (
                  <tr key={row.exam_target} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 font-medium">{row.exam_target}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {row.profiles}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {row.avg_mastered_pct}%
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {row.total_mastered}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {row.total_cards}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OperatorPanel>
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

  const {
    data: completionData,
    isLoading: completionLoading,
    error: completionError,
  } = useQuery({
    queryKey: ["operator-completion-metrics"],
    queryFn: fetchCompletionMetrics,
    refetchInterval: 60_000,
  });

  if (isLoading && completionLoading) {
    return (
      <OperatorMain>
        <OperatorPageHeader title="指标概览" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-muted/50 md:h-28"
            />
          ))}
        </div>
      </OperatorMain>
    );
  }

  if (error && completionError) {
    return (
      <OperatorMain>
        <OperatorPageHeader title="指标概览" />
        <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
      </OperatorMain>
    );
  }

  return (
    <OperatorMain>
      <OperatorPageHeader
        title="指标概览"
        description="学习完成度与 SaaS 运营指标"
        actions={
          <Link
            href="/operator"
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="返回仪表盘"
          >
            <ArrowLeft size={18} strokeWidth={1.75} />
          </Link>
        }
      />

      {completionLoading ? (
        <div className="mb-8 grid grid-cols-2 gap-3 md:gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-muted/50"
            />
          ))}
        </div>
      ) : completionError ? (
        <p className="mb-8 text-sm text-destructive">
          {getErrorMessage(completionError)}
        </p>
      ) : completionData ? (
        <CompletionSection data={completionData} />
      ) : null}

      {data && (
        <>
          <button
            type="button"
            onClick={() => setSaasExpanded(!saasExpanded)}
            className="mb-4 flex w-full items-center gap-2 rounded-md py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
          >
            {saasExpanded ? (
              <ChevronDown size={16} strokeWidth={1.75} className="shrink-0 opacity-60" />
            ) : (
              <ChevronRight size={16} strokeWidth={1.75} className="shrink-0 opacity-60" />
            )}
            SaaS 运营指标
          </button>

          {saasExpanded && (
            <>
              <SectionLabel>用户活跃</SectionLabel>
              <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <OperatorStatBlock label="DAU" value={data.activeUsers.dau} />
                <OperatorStatBlock label="WAU" value={data.activeUsers.wau} />
                <OperatorStatBlock label="MAU" value={data.activeUsers.mau} />
                <OperatorStatBlock
                  label="DAU/MAU"
                  value={`${data.activeUsers.dauMauRatio}%`}
                  sub={
                    data.activeUsers.dauMauRatio >= 20 ? "相对健康" : "偏低"
                  }
                />
              </div>

              <SectionLabel>收入</SectionLabel>
              <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <OperatorStatBlock
                  label="MRR"
                  value={`¥${(data.mrr.currentMrr / 100).toFixed(0)}`}
                  sub={`环比 ${data.mrr.momGrowth > 0 ? "+" : ""}${data.mrr.momGrowth}%`}
                />
                <OperatorStatBlock
                  label="NRR"
                  value={`${data.nrr.nrr}%`}
                  sub={data.nrr.nrr >= 100 ? "≥100% 为扩张" : "低于 100% 为收缩"}
                />
                <OperatorStatBlock
                  label="LTV"
                  value={`¥${(data.ltv.ltv / 100).toFixed(0)}`}
                  sub={`月流失 ${data.ltv.monthlyChurnRate}%`}
                />
                <OperatorStatBlock
                  label="ARPPU"
                  value={`¥${(data.arppu.arppu / 100).toFixed(0)}`}
                  sub={`${data.arppu.payingUsers} 位付费用户`}
                />
              </div>

              <SectionLabel>流失率</SectionLabel>
              <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <OperatorStatBlock
                  label="周流失率"
                  value={`${data.churn.weeklyChurnRate}%`}
                  sub={`${data.churn.weeklyChurned} / ${data.churn.weeklyActiveBase}`}
                />
                <OperatorStatBlock
                  label="月流失率"
                  value={`${data.churn.monthlyChurnRate}%`}
                  sub={`${data.churn.monthlyChurned} / ${data.churn.monthlyActiveBase}`}
                />
                <OperatorStatBlock
                  label="ARPPU (月)"
                  value={`¥${(data.arppu.monthlyArppu / 100).toFixed(2)}`}
                  sub={`${data.arppu.monthlyPayingUsers} 位付费用户`}
                />
                <OperatorStatBlock
                  label="转化率"
                  value="—"
                  sub="见主仪表盘付费转化"
                />
              </div>

              <SectionLabel>队列留存</SectionLabel>
              <OperatorPanel className="mb-8 p-4 md:p-5">
                <CohortTable data={data.cohortRetention} />
              </OperatorPanel>

              <SectionLabel>用户满意度与增长</SectionLabel>
              <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <OperatorStatBlock
                  label="NPS"
                  value={data.nps.nps}
                  sub={`${data.nps.total} 份评分`}
                />
                <OperatorStatBlock
                  label="平均评分"
                  value={data.nps.avgScore}
                  sub={`推荐 ${data.nps.promoters} / 中立 ${data.nps.passives} / 贬损 ${data.nps.detractors}`}
                />
                <OperatorStatBlock
                  label="K-factor"
                  value={data.kfactor.kfactor}
                  sub={
                    data.kfactor.kfactor >= 1
                      ? "≥1 为病毒增长"
                      : `${data.kfactor.convertedInvites}/${data.kfactor.totalInvites} 转化`
                  }
                />
                <OperatorStatBlock
                  label="邀请转化率"
                  value={`${data.kfactor.conversionRate}%`}
                  sub={`${data.kfactor.usersWhoInvited} 人发起邀请`}
                />
              </div>
            </>
          )}
        </>
      )}
    </OperatorMain>
  );
}
