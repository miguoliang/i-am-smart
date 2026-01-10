import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import { Card } from "@/components/container/Card";
import Link from "next/link";
import { Button } from "@/components/form/Button";

export const metadata: Metadata = generateSEOMetadata({
  title: "定价",
  description: "Be It Forever的定价方案，选择最适合您的学习计划。",
  keywords: ["定价", "价格", "套餐", "订阅"],
});

export default function PricingPage() {
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
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              定价方案
            </h1>
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
