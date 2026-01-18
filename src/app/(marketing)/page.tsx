import Link from "next/link";
import { Button } from "@/components/form/Button";
import { Card } from "@/components/container/Card";
import { MacOSWindow } from "@/components/container/MacOSWindow";
import { IPhoneFrame } from "@/components/container/IPhoneFrame";
import { IPadFrame } from "@/components/container/IPadFrame";
import { Brain, Mic, BarChart3, Smartphone, TrendingUp, Cloud } from "lucide-react";
import { DesktopWrapper } from "@/components/container/DesktopWrapper";
import { MockLearnScreen } from "@/components/learn/MockLearnScreen";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-16 md:pt-24 pb-8 md:pb-12">
        <div className="flex flex-col gap-12 items-center">
          {/* Text Content */}
          <div className="w-full">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-normal mb-6 text-gray-900 dark:text-white">
              让学习像呼吸一样轻松且可持续。
            </h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signin">
                <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                  开始学习
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop with MacOSWindow, IPhoneFrame, and IPadFrame */}
          <div className="w-full flex items-center justify-center overflow-hidden">
            <DesktopWrapper 
              className="h-[800px] w-full rounded-lg overflow-hidden"
              background="url('/homepage-section-1.webp') center / cover no-repeat"
            >
              <MacOSWindow
                title="卡片复习"
                width={1100}
                height={800}
                scale={0.75}
                defaultPosition={{ x: 50, y: 50 }}
                contentClassName="p-0 overflow-hidden"
              >
                <MockLearnScreen />
              </MacOSWindow>
              <IPadFrame
                orientation="landscape"
                scale={0.75}
                defaultPosition={{ x: 600, y: 150 }}
              >
                <MockLearnScreen />
              </IPadFrame>
              <IPhoneFrame
                scale={0.75}
                defaultPosition={{ x: 900, y: 300 }}
              >
                <MockLearnScreen />
              </IPhoneFrame>
            </DesktopWrapper>
          </div>
        </div>
      </section>

      {/* Smart Review Feature */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Content */}
          <div className="flex-1">
            <div className="mb-6">
              <Brain className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              智能复习
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              让系统自动安排复习计划，您只需专注于学习。
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>SM-2 算法：基于科学验证的间隔重复算法，根据记忆表现自动调整复习间隔</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>自适应学习：根据您的评分（0-5分）动态调整难度和复习频率</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>记忆曲线优化：在最佳遗忘点进行复习，最大化记忆效率</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>学习状态跟踪：新卡片 → 学习中 → 已掌握，清晰的学习路径</span>
              </li>
            </ul>
          </div>

          {/* Demo Placeholder */}
          <div className="flex-1 w-full">
            <div className="aspect-video bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <p className="text-gray-600 dark:text-gray-400 text-center px-8">
                展示卡片复习流程、复习间隔调整和学习状态转换
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Text-to-Speech Feature */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row-reverse gap-12 items-center">
          {/* Content */}
          <div className="flex-1">
            <div className="mb-6">
              <Mic className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              文本转语音
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              正确掌握每个单词的发音，提升口语能力。
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>多口音支持：美式英语和英式英语发音</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>即时播放：点击即可听到标准发音</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>沉浸式学习：通过听觉强化记忆</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>发音练习：帮助纠正发音，提升口语水平</span>
              </li>
            </ul>
          </div>

          {/* Demo Placeholder */}
          <div className="flex-1 w-full">
            <div className="aspect-video bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <p className="text-gray-600 dark:text-gray-400 text-center px-8">
                展示单词卡片上的播放按钮、不同口音切换和发音学习流程
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Statistics Feature */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Content */}
          <div className="flex-1">
            <div className="mb-6">
              <BarChart3 className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              可视化统计
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              清晰了解您的学习进度和成果。
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>学习热力图：每日学习活动一目了然</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>掌握程度图表：跟踪每个知识点的掌握情况</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>连续学习记录：保持学习习惯，记录学习天数</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>详细分析：复习次数、正确率、学习趋势等</span>
              </li>
            </ul>
          </div>

          {/* Demo Placeholder */}
          <div className="flex-1 w-full">
            <div className="aspect-video bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <p className="text-gray-600 dark:text-gray-400 text-center px-8">
                展示热力图可视化、统计图表和数据分析、学习进度跟踪
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12 bg-gray-50 dark:bg-black/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            每天被数千学习者信赖使用
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                &ldquo;间隔重复算法彻底改变了我的学习方式。现在我能更高效地掌握英语单词，记忆也更加持久。&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">张</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">张同学</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">英语学习者</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                &ldquo;文本转语音功能太棒了！我可以随时听到标准发音，口语能力提升明显。&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-semibold">李</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">李同学</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">商务英语学习者</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                &ldquo;可视化统计让我清楚地看到自己的进步，每天的学习都变得更有动力。&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">王</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">王同学</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">备考学生</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            强大而灵活
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="mb-4">
                <Smartphone className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                响应式设计
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                完美适配手机、平板和桌面设备，随时随地学习
              </p>
            </Card>
            <Card className="p-6">
              <div className="mb-4">
                <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                进度跟踪
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                详细记录每个知识点的学习历史，包括复习次数、掌握程度等
              </p>
            </Card>
            <Card className="p-6">
              <div className="mb-4">
                <Cloud className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                多设备同步
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                随时随地继续学习，数据自动同步到所有设备
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Changelog Preview Section */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            更新日志
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            了解最新版本的功能更新和改进
          </p>
          <Link href="/changelog">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              查看更新日志 →
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12 bg-gray-50 dark:bg-black/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            立即开始学习
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            下载应用或在线开始您的学习之旅
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signin">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                在线开始
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                下载应用
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
