import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = generateSEOMetadata({
  title: "更新日志",
  description: "Be It Forever的版本更新日志，了解最新功能和改进。",
  keywords: ["更新日志", "版本", "更新", "新功能"],
});

export default function ChangelogPage() {
  const changelog = [
    {
      version: "1.0.0",
      date: "2024-01-15",
      type: "major",
      changes: [
        {
          type: "新增",
          items: [
            "间隔重复学习算法 (SM-2)",
            "文本转语音功能",
            "可视化统计和进度跟踪",
            "PWA支持",
            "多设备同步",
          ],
        },
        {
          type: "改进",
          items: [
            "优化了用户界面",
            "提升了性能",
            "改进了响应式设计",
          ],
        },
      ],
    },
    {
      version: "0.9.0",
      date: "2024-01-01",
      type: "minor",
      changes: [
        {
          type: "新增",
          items: [
            "批量导入功能",
            "团队管理功能",
            "自定义学习计划",
          ],
        },
        {
          type: "修复",
          items: [
            "修复了统计数据显示问题",
            "修复了同步问题",
          ],
        },
      ],
    },
    {
      version: "0.8.0",
      date: "2023-12-15",
      type: "minor",
      changes: [
        {
          type: "新增",
          items: [
            "热力图统计",
            "每日学习记录",
            "推送通知功能",
          ],
        },
        {
          type: "改进",
          items: [
            "优化了卡片复习流程",
            "改进了用户体验",
          ],
        },
      ],
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "major":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "minor":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "patch":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case "新增":
        return "text-green-600 dark:text-green-400";
      case "改进":
        return "text-blue-600 dark:text-blue-400";
      case "修复":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              更新日志
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              了解Be It Forever的最新功能和改进。
            </p>
          </div>

          <div className="space-y-8">
            {changelog.map((release, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      v{release.version}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                        release.type
                      )}`}
                    >
                      {release.type === "major"
                        ? "重大更新"
                        : release.type === "minor"
                        ? "功能更新"
                        : "修复更新"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {release.date}
                  </span>
                </div>

                <div className="space-y-4">
                  {release.changes.map((changeGroup, groupIndex) => (
                    <div key={groupIndex}>
                      <h3
                        className={`text-lg font-semibold mb-2 ${getChangeTypeColor(
                          changeGroup.type
                        )}`}
                      >
                        {changeGroup.type}
                      </h3>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        {changeGroup.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="text-gray-700 dark:text-gray-300"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
