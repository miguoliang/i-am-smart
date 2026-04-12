"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAccounts } from "@/lib/api/accounts";
import {
  fetchUserDetail,
  banUser,
} from "@/lib/api/operator";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { DataTable, ColumnConfig } from "@/components/table/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/form/Button";
import { Input } from "@/components/form/Input";
import { downloadCSV } from "@/lib/utils/csv";
import { Paginator } from "../components/Paginator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/overlay/Dialog";
import { User, Ban, ShieldCheck } from "lucide-react";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { toast } from "sonner";
import { OperatorMain } from "../components/OperatorChrome";
import { Skeleton } from "@/components/ui/skeleton";
import { EXAM_PICKER_ENTRIES, getExamTarget } from "@i-am-smart/shared/constants";

const DEBOUNCE_MS = 300;

interface Account {
  id: string;
  username: string;
  email?: string;
  role?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
  dailyReviewCount?: number;
  plan?: "free" | "pro";
  exam_target?: string | null;
}

/** 与设置里「选择考试目标」合并行一致（如 PET/四级、雅思/托福） */
function learningVocabLabel(examTargetId: string | null | undefined): string {
  if (!examTargetId) return "—";
  const entry = EXAM_PICKER_ENTRIES.find((e) =>
    (e.examTargetIds as readonly string[]).includes(examTargetId)
  );
  if (entry) return entry.label;
  return getExamTarget(examTargetId)?.name ?? examTargetId;
}

// 默认列配置
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "id", label: "ID", visible: false },
  { key: "username", label: "用户名", visible: true },
  { key: "email", label: "邮箱", visible: false },
  { key: "plan", label: "套餐", visible: true },
  { key: "exam_target", label: "学习词库", visible: true },
  { key: "dailyReviewCount", label: "今日复习", visible: true },
  { key: "last_sign_in_at", label: "最后登录", visible: true },
  { key: "created_at", label: "创建时间", visible: true },
  { key: "actions", label: "操作", visible: true },
];

const STORAGE_KEY = "accounts_table_columns_v2";

export default function AccountsPage() {
  useOperatorAuth();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<Account | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    data: accountsData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["accounts", currentPage, perPage, debouncedSearch],
    queryFn: () =>
      fetchAccounts(currentPage, perPage, debouncedSearch || undefined),
  });

  const accounts = accountsData?.accounts || [];
  const hasMore = accountsData?.pagination?.hasMore || false;
  const error = queryError ? getErrorMessage(queryError) : null;

  const {
    data: userDetail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ["operator", "user", detailUserId],
    queryFn: () => fetchUserDetail(detailUserId!),
    enabled: detailDialogOpen && !!detailUserId,
  });

  const banMutation = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) =>
      banUser(id, banned),
    onSuccess: (_, { id, banned }) => {
      toast.success(banned ? "已封禁用户" : "已解封用户");
      setBanDialogOpen(false);
      setBanTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["operator", "user", id] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // 定义列
  const columns = useMemo<ColumnDef<Account>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">{row.getValue("id")}</span>
        ),
      },
      {
        accessorKey: "username",
        header: "用户名",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("username")}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "邮箱",
        cell: ({ row }) => {
          const email = row.getValue("email") as string | undefined;
          return email ? (
            <span className="max-w-[14rem] truncate font-mono text-sm" title={email}>
              {email}
            </span>
          ) : (
            "-"
          );
        },
      },
      {
        accessorKey: "plan",
        header: "套餐",
        cell: ({ row }) => {
          const plan = row.getValue("plan") as string | undefined;
          const isPro = plan === "pro";
          return (
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                isPro
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isPro ? "Pro" : "免费"}
            </span>
          );
        },
      },
      {
        accessorKey: "exam_target",
        header: "学习词库",
        cell: ({ row }) => (
          <span className="text-sm">{learningVocabLabel(row.getValue("exam_target") as string | null)}</span>
        ),
      },
      {
        accessorKey: "dailyReviewCount",
        header: "今日复习",
        cell: ({ row }) => {
          const count = row.getValue("dailyReviewCount") as number;
          return (
            <span className={`font-mono ${count > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
              {count || 0}
            </span>
          );
        },
      },
      {
        accessorKey: "last_sign_in_at",
        header: "最后登录",
        cell: ({ row }) => {
          const lastSignIn = row.getValue("last_sign_in_at") as string | null | undefined;
          if (!lastSignIn) {
            return <span className="text-muted-foreground">从未登录</span>;
          }
          return formatDate(lastSignIn);
        },
      },
      {
        accessorKey: "created_at",
        header: "创建时间",
        cell: ({ row }) => {
          const date = row.getValue("created_at") as string;
          return formatDate(date);
        },
      },
      {
        id: "actions",
        header: "操作",
        cell: ({ row }) => {
          const account = row.original;
          const role = (account.role as string)?.trim() || "learner";
          const isOperator = role === "operator";
          const isBanned = !!account.banned_until;

          return (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailUserId(account.id);
                  setDetailDialogOpen(true);
                }}
                className="gap-1"
              >
                <User className="h-4 w-4" />
                查看详情
              </Button>
              {!isOperator && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBanTarget(account);
                      setBanDialogOpen(true);
                    }}
                    className="gap-1"
                  >
                    <Ban className="h-4 w-4" />
                    {isBanned ? "解封" : "封禁"}
                  </Button>
                </>
              )}
              {isOperator && (
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> 操作员
                </span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <OperatorMain>
      <DataTable
        data={accounts}
        columns={columns}
        loading={loading}
        error={error}
        toolbarLeft={
          <>
            <Input
              type="search"
              placeholder="按用户名或邮箱搜索..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-sm min-w-[12rem]"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={accounts.length === 0 || loading}
              onClick={() =>
                downloadCSV(
                  accounts.map((a) => ({
                    ...a,
                    plan_label: a.plan === "pro" ? "Pro" : "免费",
                    learning_vocab: learningVocabLabel(a.exam_target),
                  })) as unknown as Record<string, unknown>[],
                  [
                    { key: "id", label: "ID" },
                    { key: "username", label: "用户名" },
                    { key: "email", label: "邮箱" },
                    { key: "plan_label", label: "套餐" },
                    { key: "learning_vocab", label: "学习词库" },
                    { key: "dailyReviewCount", label: "今日复习" },
                    { key: "last_sign_in_at", label: "最后登录" },
                    { key: "created_at", label: "创建时间" },
                  ],
                  `accounts-${new Date().toISOString().slice(0, 10)}`
                )
              }
            >
              导出 CSV
            </Button>
          </>
        }
        pagination={{ enabled: false }}
        columnSettings={{
          enabled: true,
          storageKey: STORAGE_KEY,
          defaultColumns: DEFAULT_COLUMNS,
        }}
        sorting={{ enabled: true }}
        emptyMessage="暂无数据"
        getRowClassName={(account) => {
          const role = (account.role as string)?.trim() || "learner";
          return role === "operator" ? "border-l-2 border-primary bg-muted/40" : "";
        }}
        refreshButton={{
          onClick: () => refetch(),
          loading: loading,
        }}
      />

      {!loading && accounts.length > 0 && (
        <div className="mt-4">
          <Paginator
            currentPage={currentPage}
            totalPages={hasMore ? currentPage + 1 : currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            itemsPerPage={perPage}
            totalItems={accounts.length}
          />
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription className="min-h-[1.25rem]">
              {detailLoading ? (
                <Skeleton className="h-4 w-40" aria-hidden />
              ) : (
                (userDetail?.profile.username ?? "—")
              )}
            </DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <div
              className="flex flex-col gap-6 py-4"
              aria-busy="true"
              aria-label="正在加载用户详情"
            >
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-full max-w-[14rem]" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-24" />
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-[4.5rem] w-full rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-24" />
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {userDetail && (
            <div className="space-y-6 py-4">
              {/* Profile */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-muted-foreground font-semibold mb-1">用户名</h4>
                  <p>{userDetail.profile.username}</p>
                </div>
                <div>
                  <h4 className="text-sm text-muted-foreground font-semibold mb-1">邮箱</h4>
                  <p>{userDetail.profile.email || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm text-muted-foreground font-semibold mb-1">角色</h4>
                  <p>{userDetail.profile.role}</p>
                </div>
                <div>
                  <h4 className="text-sm text-muted-foreground font-semibold mb-1">注册时间</h4>
                  <p>{formatDate(userDetail.profile.created_at)}</p>
                </div>
                <div>
                  <h4 className="text-sm text-muted-foreground font-semibold mb-1">最后登录</h4>
                  <p>{userDetail.profile.last_sign_in_at ? formatDate(userDetail.profile.last_sign_in_at) : "从未登录"}</p>
                </div>
                {userDetail.profile.banned_until && (
                  <div>
                    <h4 className="text-sm text-muted-foreground font-semibold mb-1">封禁状态</h4>
                    <p className="text-red-500 font-medium">已封禁</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div>
                <h3 className="font-semibold mb-3">学习统计</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "总词量", value: userDetail.stats.total, color: "bg-blue-500" },
                    { label: "已掌握", value: userDetail.stats.mastered, color: "bg-green-500" },
                    { label: "学习中", value: userDetail.stats.learning, color: "bg-yellow-500" },
                    { label: "今日待复习", value: userDetail.stats.dueToday, color: "bg-red-500" },
                  ].map((s) => (
                    <div key={s.label} className={`${s.color} text-white rounded-lg p-3 text-center`}>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="font-semibold mb-3">最近订单</h3>
                {userDetail.recentOrders.length === 0 ? (
                  <p className="text-muted-foreground text-sm">暂无订单</p>
                ) : (
                  <div className="space-y-2">
                    {userDetail.recentOrders.map((order) => (
                      <div
                        key={order.out_trade_no}
                        className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-mono text-xs">{order.out_trade_no}</span>
                          <span className="ml-2 text-muted-foreground">
                            {order.pay_channel?.startsWith("wechat") ? "微信" : order.pay_channel?.startsWith("alipay") ? "支付宝" : order.pay_channel ?? "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">¥{(order.amount_total / 100).toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            order.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {order.status === "paid" ? "已支付" : order.status === "pending" ? "待支付" : "失败"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {banTarget?.banned_until ? "解封用户" : "封禁用户"}
            </DialogTitle>
            <DialogDescription>
              {banTarget?.banned_until
                ? `确定要解封用户 ${banTarget?.username} 吗？`
                : `确定要封禁用户 ${banTarget?.username} 吗？封禁后该用户将无法登录。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false);
                setBanTarget(null);
              }}
              disabled={banMutation.isPending}
            >
              取消
            </Button>
            <Button
              variant={banTarget?.banned_until ? "default" : "destructive"}
              onClick={() => {
                if (banTarget) {
                  banMutation.mutate({
                    id: banTarget.id,
                    banned: !banTarget.banned_until,
                  });
                }
              }}
              loading={banMutation.isPending}
            >
              {banTarget?.banned_until ? "确认解封" : "确认封禁"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperatorMain>
  );
}

