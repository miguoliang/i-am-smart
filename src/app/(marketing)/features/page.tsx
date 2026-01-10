import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = generateSEOMetadata({
  title: "功能特性",
  description: "了解Be It Forever的所有功能特性，包括间隔重复算法、文本转语音、可视化统计等。",
  keywords: ["功能", "特性", "间隔重复", "SM-2", "文本转语音", "统计"],
});

export default function FeaturesPage() {
  const features = [
    {
      title: "间隔重复算法 (SM-2)",
      description: "使用经过科学验证的Anki SM-2算法，根据您的记忆表现自动调整复习间隔，最大化学习效率。",
      icon: "🧠",
    },
    {
      title: "文本转语音",
      description: "支持美式和英式发音，帮助您正确掌握单词和短语的发音，提升口语能力。",
      icon: "🗣️",
    },
    {
      title: "可视化统计",
      description: "通过热力图、掌握程度图表和每日连续学习记录，清晰了解您的学习进度和成果。",
      icon: "📊",
    },
    {
      title: "响应式设计",
      description: "完美适配手机、平板和桌面设备，随时随地学习，不受设备限制。",
      icon: "📱",
    },
    {
      title: "PWA支持",
      description: "支持渐进式Web应用，可以安装到主屏幕，提供接近原生应用的体验。",
      icon: "⚡",
    },
    {
      title: "批量导入",
      description: "支持CSV和JSON格式的批量导入，快速创建大量学习卡片。",
      icon: "📥",
    },
    {
      title: "进度跟踪",
      description: "详细记录每个知识点的学习历史，包括复习次数、掌握程度等。",
      icon: "📈",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            功能特性
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            探索Be It Forever的强大功能，让学习变得更加高效和有趣。
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
