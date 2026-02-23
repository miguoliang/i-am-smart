import Link from "next/link";
import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/form/Button";
import { Card } from "@/components/container/Card";

export const metadata: Metadata = generateSEOMetadata({
  title: "定价",
  description:
    "选择适合你的学习计划。免费版永久免费，Pro版解锁全部功能。支持微信支付和支付宝，7天无理由退款。",
  canonical: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            选择适合你的提分计划
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
            从免费开始，把碎片时间变成高分
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8">
          {/* 免费版 */}
          <Card className="p-8 relative">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                免费版（Free）
              </h2>
              <div className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                ¥0{" "}
                <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                  / 永久免费
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-gray-700 dark:text-gray-300">
                <span className="mr-2 text-green-600 dark:text-green-400 font-bold">
                  ✓
                </span>
                <span>每天免费学习</span>
              </li>
              <li className="flex items-start text-gray-700 dark:text-gray-300">
                <span className="mr-2 text-green-600 dark:text-green-400 font-bold">
                  ✓
                </span>
                <span>A1-A2单词</span>
              </li>
              <li className="flex items-start text-gray-700 dark:text-gray-300">
                <span className="mr-2 text-green-600 dark:text-green-400 font-bold">
                  ✓
                </span>
                <span>随时随地、多端使用，多端同步</span>
              </li>
              <li className="flex items-start text-gray-700 dark:text-gray-300">
                <span className="mr-2 text-green-600 dark:text-green-400 font-bold">
                  ✓
                </span>
                <span>基础学习与统计功能</span>
              </li>
            </ul>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              适合人群：零成本体验，慢节奏学习，准备低级别考试的学生
            </p>

            <Link href="/signin" className="block">
              <Button
                variant="outline"
                className="w-full bg-blue-50 hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-gray-700"
                size="lg"
              >
                立即免费开始
              </Button>
            </Link>
          </Card>

          {/* Pro版（推荐） */}
          <Card className="p-8 relative border-2 border-amber-400 dark:border-amber-500 shadow-xl scale-105">
            <div className="absolute top-0 right-0 bg-amber-400 dark:bg-amber-500 text-gray-900 dark:text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
              推荐
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Pro版
              </h2>
              <div className="mb-2">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  ¥29 <span className="text-lg font-normal">/ 月</span>
                </div>
                <div className="text-lg text-gray-700 dark:text-gray-300">
                  或{" "}
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    ¥199
                  </span>{" "}
                  / 年
                  <span className="ml-2 text-sm">
                    <span className="line-through text-gray-400 dark:text-gray-500">
                      原价 ¥348
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-bold ml-1">
                      省 ¥149
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      ≈ 58% off
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-gray-700 dark:text-gray-300">
                <span className="mr-2 text-amber-600 dark:text-amber-400 font-bold">
                  ✓
                </span>
                <span>
                  <strong>无限学习</strong>（不限时、不限量）
                </span>
              </li>
              <li className="flex items-start text-gray-700 dark:text-gray-300">
                <span className="mr-2 text-amber-600 dark:text-amber-400 font-bold">
                  ✓
                </span>
                <span>
                  <strong>全级别单词</strong>（A1-C2，KET到雅思）
                </span>
              </li>
              <li className="flex items-start text-gray-700 dark:text-gray-300">
                <span className="mr-2 text-amber-600 dark:text-amber-400 font-bold">
                  ✓
                </span>
                <span>
                  <strong>随时随地、多端使用，多端同步</strong>
                </span>
              </li>
              <li className="flex items-start text-gray-700 dark:text-gray-300">
                <span className="mr-2 text-amber-600 dark:text-amber-400 font-bold">
                  ✓
                </span>
                <span>
                  <strong>高级学习功能</strong>
                  （个性化复习计划、错题分析、口语练习、进阶批改）
                </span>
              </li>
            </ul>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              适合人群：追求极致效率，快节奏学习，准备高级别考试的学生
            </p>

            <Link href="/signin?next=/pay" className="block">
              <Button
                className="w-full bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-600 text-gray-900 dark:text-white font-bold shadow-lg"
                size="lg"
              >
                立即升级 Pro
              </Button>
            </Link>
          </Card>
        </div>

        {/* 底部信任信息 */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          7天无理由退款 · 随时取消订阅 · 已帮助数百学生提分
        </div>

        {/* 支付方式 */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          微信支付 · 支付宝
        </div>
      </section>
    </div>
  );
}
