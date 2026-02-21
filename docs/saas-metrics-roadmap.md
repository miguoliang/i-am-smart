# SaaS 指标路线图

## 商业模式：订阅制 SaaS to C

## Phase A — 已完成 ✅

| 指标 | 状态 |
|------|------|
| DAU/WAU/MAU + DAU/MAU Ratio | ✅ `/operator/saas` |
| Cohort Retention (D1/D7/D30) | ✅ 按注册周队列 |
| Churn Rate (周/月) | ✅ |
| ARPPU (全量+月度) | ✅ |
| 注册→付费转化率 | ✅ 主仪表盘 |

## Phase A2 — 订阅制指标（基于现有 pay_orders 近似）🔜

可以先基于 pay_orders 按月聚合近似计算，等接 Stripe 后切换到真实订阅数据：

| 指标 | 计算方式 | 备注 |
|------|----------|------|
| MRR + 月环比 | 当月 paid 订单总额 | 近似值，真实 MRR 需要 Stripe 订阅 |
| NRR (Net Revenue Retention) | 同批用户上月 vs 本月收入 | 需要按 account_id 追踪月度收入变化 |
| LTV | ARPPU / Monthly Churn Rate | 简单公式先用 |
| LTV/CAC Ratio | LTV / CAC | CAC 暂时为 0（无投放） |

## Phase B — 需要外部依赖

### B1: Stripe 订阅（解锁真实 MRR/NRR）

需要：
- 接入 Stripe 或自建订阅管理（subscription 表：plan, status, current_period_start/end, cancel_at）
- Webhook 处理续费、取消、升降级事件
- 真实 MRR = 活跃订阅数 × 月费

### B2: 前端埋点（解锁 Session 数据）

| 指标 | 实现方案 |
|------|----------|
| Session Length/Frequency | PostHog（推荐）或自建 session_events 表 |

PostHog 免费版 100 万事件/月，一次性解决所有行为分析。

### B3: 增长指标

| 指标 | 依赖 |
|------|------|
| K-factor (病毒系数) | 需要先做邀请/分享功能 |
| CAC + Payback Period | 需要营销花费数据（等有投放再说） |

### B4: 用户满意度

| 指标 | 实现方案 |
|------|----------|
| NPS/CSAT | app 内评分弹窗 → 写入 feedback 表（最简单，随时可做） |

## 优先级

1. ✅ Phase A — 已完成
2. 🔜 Phase A2 — MRR/NRR/LTV 近似计算（纯 SQL，现在就能做）
3. 🔜 NPS — 最简单，加个弹窗
4. 📋 Stripe 订阅 — 解锁真实订阅指标
5. 📋 PostHog — 解锁 session 分析
6. 📋 邀请功能 — 解锁 K-factor
7. 📋 营销投放 — 解锁 CAC
