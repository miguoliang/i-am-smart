"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  fetchKnowledgeErrorReports,
  resolveKnowledgeErrorReport,
  type KnowledgeErrorReportRow,
} from "@/lib/api/knowledgeErrorReports";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { Button } from "@/components/form/Button";
import { toast } from "sonner";

export default function KnowledgeErrorReportsPage() {
  useOperatorAuth();
  const queryClient = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);

  const { data: rows = [], isLoading, error: queryError } = useQuery({
    queryKey: ["knowledge-error-reports", showResolved],
    queryFn: () =>
      fetchKnowledgeErrorReports({ unresolvedOnly: !showResolved }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => resolveKnowledgeErrorReport(id),
    onSuccess: () => {
      toast.success("已标记为处理完成");
      void queryClient.invalidateQueries({ queryKey: ["knowledge-error-reports"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const error = queryError ? getErrorMessage(queryError) : null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">词条纠错</h1>
          <p className="text-sm text-muted-foreground mt-1">
            用户在学习页按 <kbd className="px-1 rounded bg-muted font-mono text-xs">W</kbd>{" "}
            提交的待核实词条。请在「单词列表」中修改后，点击「已处理」。
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={showResolved ? "outline" : "default"}
            size="sm"
            onClick={() => setShowResolved(false)}
          >
            待处理
          </Button>
          <Button
            type="button"
            variant={showResolved ? "default" : "outline"}
            size="sm"
            onClick={() => setShowResolved(true)}
          >
            全部
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/operator/knowledges">去单词列表</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : null}

      {isLoading ? (
        <p className="text-muted-foreground">加载中…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">暂无记录</p>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="p-3 font-medium">时间</th>
                <th className="p-3 font-medium">英文</th>
                <th className="p-3 font-medium">中文</th>
                <th className="p-3 font-medium">代码</th>
                <th className="p-3 font-medium">用户</th>
                <th className="p-3 font-medium w-40">操作</th>
              </tr>
            </thead>
            <tbody>
              {(rows as KnowledgeErrorReportRow[]).map((r) => (
                <tr key={r.id} className="border-b border-border/80 hover:bg-muted/20">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="p-3 font-medium">{r.knowledge_name}</td>
                  <td className="p-3 max-w-[200px] truncate" title={r.knowledge_description}>
                    {r.knowledge_description}
                  </td>
                  <td className="p-3 font-mono text-xs">{r.knowledge_code}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {r.reporter_id.slice(0, 8)}…
                  </td>
                  <td className="p-3">
                    {r.resolved_at ? (
                      <span className="text-xs text-muted-foreground">
                        已处理 {formatDate(r.resolved_at)}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={resolveMutation.isPending}
                        onClick={() => resolveMutation.mutate(r.id)}
                      >
                        已处理
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
