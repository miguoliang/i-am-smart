# SaaS 指标路线图

## Phase A — 扩展现有 Dashboard（纯 Supabase）✅ 当前

基于现有数据（account_cards, pay_orders, auth.users）计算：

| 指标 | 计算方式 | 状态 |
|------|----------|------|
| DAU/WAU/MAU + Ratio | account_cards.updated_at 去重 account_id | 待做 |
| Cohort Retention (D1/D7/D30) | 按注册周分组，追踪后续活跃天数 | 待做 |
| Churn Rate (周/月) | N天内无活跃 = 流失，流失数/期初活跃数 | 待做 |
| ARPPU | pay_orders 总收入 / 付费用户数 | 待做 |
| 注册→付费转化率 | 已有，微调展示 | 已有 |

## Phase B — 需要接入外部数据源

### B1: 付费/订阅指标（需确认付费模式）

当前付费是一次性购买（pay_orders），如果转订阅制：

| 指标 | 依赖 | 备注 |
|------|------|------|
| MRR + 月环比 | Stripe 订阅数据 | 一次性付费无 MRR 概念 |
| NRR (Net Revenue Retention) | 按月追踪同批用户收入 | 需要订阅续费/升降级数据 |
| LTV | 历史付费 + 留存曲线拟合 | 可先用简单公式：ARPPU / Churn Rate |
| LTV/CAC Ratio | LTV + CAC | 见 B2 |

**决策点：** 是否转订阅制？如果保持一次性付费，MRR/NRR 不适用，改为追踪「月收入」和「复购率」。

### B2: 营销/获客指标

| 指标 | 依赖 | 备注 |
|------|------|------|
| CAC (获客成本) | 营销花费数据 | 需要手动录入或接广告平台 API |
| CAC Payback Period | CAC + ARPPU | CAC / 月均 ARPPU |

**决策点：** 目前有投放渠道吗？如果纯自然增长，CAC ≈ 0，这组指标暂时无意义。

### B3: 用户行为深度指标（需埋点）

| 指标 | 依赖 | 实现方案 |
|------|------|----------|
| Session Length/Frequency | 前端埋点 | 方案 A: 接 PostHog（推荐）；方案 B: 自建 session_events 表 |
| K-factor (病毒系数) | 邀请/分享事件 | 需要先做邀请功能 + 埋点追踪 |
| NPS/CSAT | 用户反馈评分 | 可在 app 内弹评分卡，写入 feedback 表 |

**决策点：** 是否接 PostHog？免费版 100 万事件/月，能一次性解决 session tracking + 所有行为分析。

## 优先级建议

1. ✅ Phase A — 立即可做，纯 SQL
2. 🔜 PostHog 接入 — 解锁 session/行为分析，ROI 最高
3. 📋 邀请机制 — 解锁 K-factor，同时也是增长功能
4. 💰 Stripe 订阅 — 如果决定转订阅制
5. 📊 营销数据 — 等有投放再说
