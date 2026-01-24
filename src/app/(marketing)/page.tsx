import Link from "next/link";
import { Button } from "@/components/form/Button";
import { Card } from "@/components/container/Card";

export default function HomePage() {
  const coreFeatures = [
    {
      icon: "🧠",
      title: "智能复习",
      description: "让系统自动安排复习计划，您只需专注于学习。",
      features: [
        "SM-2 算法：基于科学验证的间隔重复算法，根据记忆表现自动调整复习间隔",
        "自适应学习：根据您的评分（0-5分）动态调整难度和复习频率",
        "记忆曲线优化：在最佳遗忘点进行复习，最大化记忆效率",
        "学习状态跟踪：新卡片 → 学习中 → 已掌握，清晰的学习路径",
      ],
    },
    {
      icon: "🗣️",
      title: "文本转语音",
      description: "正确掌握每个单词的发音，提升口语能力。",
      features: [
        "多口音支持：美式英语和英式英语发音",
        "即时播放：点击即可听到标准发音",
        "沉浸式学习：通过听觉强化记忆",
        "发音练习：帮助纠正发音，提升口语水平",
      ],
    },
    {
      icon: "📊",
      title: "可视化统计",
      description: "清晰了解您的学习进度和成果。",
      features: [
        "学习热力图：每日学习活动一目了然",
        "掌握程度图表：跟踪每个知识点的掌握情况",
        "连续学习记录：保持学习习惯，记录学习天数",
        "详细分析：复习次数、正确率、学习趋势等",
      ],
    },
  ];

  const plans = [
    {
      name: "免费版",
      price: "免费",
      description: "适合个人学习者",
      features: [
        "基础间隔重复学习",
        "每日复习限制",
        "基础统计功能",
        "社区支持",
      ],
      cta: "免费开始",
      href: "/signin",
    },
    {
      name: "专业版",
      price: "¥29/月",
      description: "适合认真学习者",
      features: [
        "无限复习次数",
        "高级统计和分析",
        "多设备同步",
        "优先支持",
        "自定义学习计划",
      ],
      cta: "开始使用",
      href: "/signin",
      featured: true,
    },
    {
      name: "企业版",
      price: "定制",
      description: "适合团队和教育机构",
      features: [
        "所有专业版功能",
        "团队管理",
        "批量导入",
        "定制化服务",
        "专属客户经理",
      ],
      cta: "联系销售",
      href: "/signin",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Headline Section */}
      <section id="headline" className="max-w-7xl mx-auto px-4 pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white">
            用碎片时间，提英语成绩
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
            随时随地，AI辅助，无需下载，多端同步
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="w-full py-16 md:py-24 from-amber-50 to-blue-50 dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="text-center">
            <Link href="/signin">
              <Button 
                size="lg" 
                className="text-lg md:text-xl px-12 py-6 bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-600 text-gray-900 dark:text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                现在开始，3分钟第一课
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            掌握知识的最佳方式
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
            基于科学验证的间隔重复算法，让学习更高效、记忆更持久
          </p>
        </div>

        <div className="space-y-24">
          {coreFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex flex-col ${
                index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              } gap-12 items-center`}
            >
              {/* Content */}
              <div className="flex-1">
                <div className="text-5xl mb-6">{feature.icon}</div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  {feature.description}
                </p>
                <ul className="space-y-4">
                  {feature.features.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Placeholder for demo */}
              <div className="flex-1 w-full">
                <div className="aspect-video bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  <p className="text-gray-600 dark:text-gray-400 text-center px-8">
                    功能演示区域
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              定价方案
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              选择最适合您的学习计划，开始您的终身学习之旅。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`p-8 relative ${
                  plan.featured
                    ? "border-2 border-primary shadow-lg scale-105"
                    : ""
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-medium rounded-bl-lg">
                    推荐
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
                    {plan.price}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start text-gray-700 dark:text-gray-300"
                    >
                      <span className="mr-2 text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="block">
                  <Button
                    variant={plan.featured ? "default" : "outline"}
                    className="w-full"
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
