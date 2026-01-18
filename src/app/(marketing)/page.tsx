import Link from "next/link";
import { Button } from "@/components/form/Button";
import { ImagePlaceholder } from "@/components/marketing/ImagePlaceholder";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 via-amber-50/30 to-white">
      {/* Hero Section - 戳痛区 */}
      <section className="max-w-7xl mx-auto px-4 pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="w-full lg:w-1/2 space-y-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium leading-tight text-gray-900">
              孩子英语班几年，钱花了时间搭了，还是学了就忘？
            </h1>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              我们用每天3分钟闪卡，一起帮他记住，也帮你少点心疼。
            </p>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              报班、买课、陪写作业...看着孩子对着单词本崩溃，你心疼又无力。钱花了，时间搭了，结果还是学了就忘。是不是该换个思路了？
            </p>
          </div>

          {/* 挫败图片区 */}
          <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
            <ImagePlaceholder
              alt="孩子写作业疲惫的场景"
              variant="pain"
              className="aspect-4/5 rounded-lg shadow-lg"
            />
            <ImagePlaceholder
              alt="家长无奈看孩子学习的场景"
              variant="pain"
              className="aspect-4/5 rounded-lg shadow-lg mt-8"
            />
          </div>
        </div>
      </section>

      {/* 中间向往区 - 美好变化 */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16 bg-white/50">
        <div className="space-y-8 md:space-y-12">
          {/* 文案 */}
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-medium text-gray-900">
              现在，我们父子俩一起用最简单的方式翻盘
            </h2>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              等校车时刷几张、地铁上翻一翻、睡前一起过一遍...
              <br />
              儿子记住&ldquo;apple&rdquo;时小眼睛发亮，你也看到他自信慢慢回来。
            </p>
          </div>

          {/* 温馨图片网格 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <ImagePlaceholder
              alt="父子一起开心学习，孩子眼睛发亮"
              variant="joy"
              className="aspect-3/4 rounded-lg shadow-md"
            />
            <ImagePlaceholder
              alt="孩子开心记住单词，自信的笑容"
              variant="joy"
              className="aspect-3/4 rounded-lg shadow-md"
            />
            <ImagePlaceholder
              alt="地铁上刷闪卡学习"
              variant="commute"
              className="aspect-3/4 rounded-lg shadow-md"
            />
            <ImagePlaceholder
              alt="睡前一起学习，温馨的亲子时光"
              variant="bedtime"
              className="aspect-3/4 rounded-lg shadow-md"
            />
          </div>
        </div>
      </section>

      {/* 行动区 - CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="bg-linear-to-br from-amber-50 to-blue-50 rounded-2xl p-8 md:p-12 shadow-lg">
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-medium text-gray-900">
                零负担开始，就今天
              </h2>
              <div className="space-y-3 text-base md:text-lg text-gray-700 max-w-2xl mx-auto">
                <p>• PWA，浏览器直接打开，无需下载</p>
                <p>• A1到C2全覆盖，KET到雅思一路陪伴</p>
                <p>• 一张闪卡 → 点认识/不认识 → 下一张</p>
                <p>• 第一天只要3分钟，系统自动帮你记住</p>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/signin">
                <Button 
                  size="lg" 
                  className="text-lg md:text-xl px-12 py-6 bg-amber-400 hover:bg-amber-500 text-gray-900 font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  现在开始，3分钟第一课
                </Button>
              </Link>
            </div>

            <p className="text-sm text-gray-600 pt-4">
              无需注册，打开即用。你的学习数据只属于你。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
