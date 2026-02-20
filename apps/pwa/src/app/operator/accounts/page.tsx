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
import { DistributeCardsDialog } from "./components/DistributeCardsDialog";
import { Paginator } from "../import/components/Paginator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/overlay/Dialog";
import { Gift, User, Ban, ShieldCheck } from "lucide-react";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { formatDate } from "@/lib/utils/dateUtils";
import { toast } from "sonner";

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
}

// 默认列配置
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "id", label: "ID", visible: false },
  { key: "username", label: "用户名", visible: true },
  { key: "email", label: "邮箱", visible: true },
  { key: "role", label: "角色", visible: true },
  { key: "dailyReviewCount", label: "今日复习", visible: true },
  { key: "last_sign_in_at", label: "最后登录", visible: true },
  { key: "created_at", label: "创建时间", visible: true },
  { key: "actions", label: "操作", visible: true },
];

const STORAGE_KEY = "accounts_table_columns";

export default function AccountsPage() {
  useOperatorAuth();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [distributeDialogOpen, setDistributeDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
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
        cell: ({ row }) => row.getValue("email") || "-",
      },
      {
        accessorKey: "role",
        header: "角色",
        cell: ({ row }) => {
          const role = (row.getValue("role") as string)?.trim() || "learner";
          return (
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                role === "operator"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {role}
            </span>
          );
        },
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAccount(account);
                      setDistributeDialogOpen(true);
                    }}
                    className="gap-1"
                  >
                    <Gift className="h-4 w-4" />
                    分配卡片
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
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          账户管理
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          查看和管理所有用户账户
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Input
          type="search"
          placeholder="按用户名或邮箱搜索..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          size="sm"
          disabled={accounts.length === 0}
          onClick={() =>
            downloadCSV(
              accounts as unknown as Record<string, unknown>[],
              [
                { key: "id", label: "ID" },
                { key: "username", label: "用户名" },
                { key: "email", label: "邮箱" },
                { key: "role", label: "角色" },
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
      </div>

      <DataTable
        data={accounts}
        columns={columns}
        loading={loading}
        error={error}
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
          return role === "operator" 
            ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500" 
            : "";
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

      {selectedAccount && (
        <DistributeCardsDialog
          open={distributeDialogOpen}
          onOpenChange={setDistributeDialogOpen}
          accountId={selectedAccount.id}
          accountUsername={selectedAccount.username}
          onSuccess={() => {
            // Optionally refresh accounts list
          }}
        />
      )}

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>
              {userDetail?.profile.username ?? "加载中..."}
            </DialogDescription>
          </DialogHeader>

          {detailLoading && <p className="py-4 text-muted-foreground">加载中...</p>}

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
    </div>
  );
}

