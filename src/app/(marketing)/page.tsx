import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 dark:text-white">
            背它一辈子
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            基于间隔重复的英语学习应用，帮助您终身掌握知识
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            使用经过验证的SM-2算法优化您的学习，支持文本转语音，提供可视化统计和进度跟踪。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/learn">开始学习</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="/features">了解更多</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            核心功能
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                🧠 间隔重复算法
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                使用经过验证的Anki SM-2算法，科学优化您的学习节奏，提高记忆效率。
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                🗣️ 文本转语音
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                集成美式和英式发音支持，让语言学习更加沉浸和自然。
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                📊 可视化统计
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                通过热力图、掌握程度和每日连续学习记录，清晰跟踪您的学习进度。
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                📱 响应式设计
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                采用移动优先设计，使用Tailwind CSS和Radix UI构建美观界面。
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                🔐 安全认证
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                安全的身份验证和授权系统，支持学习者、操作员和管理员角色。
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                🛠️ 管理后台
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                强大的后端界面，支持内容管理、批量导入和用户管理。
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            准备好开始学习了吗？
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            立即开始您的学习之旅，让知识伴随您一生。
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/learn">免费开始</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
