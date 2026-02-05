import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateSEOMetadata({
  title: "隐私政策",
  description:
    "聪明的背单词工具隐私政策：我们仅收集必要信息（如邮箱），用于账号与学习服务，并保障您的数据安全与权利。",
  keywords: ["隐私政策", "个人信息", "数据保护"],
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-white">
            隐私政策
          </h1>
          <p className="text-muted-foreground text-sm mb-10">
            生效日期：2026 年 2 月 1 日
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-10">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                1. 适用范围
              </h2>
              <p>
                本政策适用于「聪明的背单词工具」产品及服务（以下简称「本产品」）。使用本产品即表示您同意本政策。我们建议您定期查阅本页以了解最新条款。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                2. 我们收集的信息
              </h2>
              <p className="mb-4">
                <strong className="text-gray-900 dark:text-white">
                  我们仅收集为向您提供账号与学习服务所必需的个人信息。
                </strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-gray-900 dark:text-white">电子邮箱（email）</strong>
                  ：用于注册/登录、账号找回及必要时与您联系，是我们收集的唯一个人身份信息。
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">学习与使用数据</strong>
                  ：如您的复习进度、卡片掌握情况等，仅用于在本产品内为您提供个性化学习与统计，不用于识别您的个人身份对外使用。
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">技术信息</strong>
                  ：访问时间、设备类型、浏览器类型等日志信息，可能以匿名或聚合方式用于保障服务安全与改进产品，不用于识别具体用户。
                </li>
              </ul>
              <p className="mt-4">
                我们不会收集您的姓名、电话、地址等额外个人信息，除非您主动在反馈或客服场景中提供，且我们仅会按您提供时的目的使用。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                3. 信息使用目的
              </h2>
              <p>我们使用上述信息仅用于：</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>创建、维护与保护您的账号；</li>
                <li>提供学习内容、复习计划与统计功能；</li>
                <li>保障服务安全、防止滥用与满足法律义务；</li>
                <li>在您同意的前提下发送与产品相关的通知（如可选的学习提醒）；</li>
                <li>在法律允许范围内改进产品与用户体验。</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                4. 信息存储与安全
              </h2>
              <p>
                您的数据存储在受控的服务器环境中，我们采用行业通用技术与管理措施保护数据安全，防止未经授权的访问、泄露、篡改或破坏。我们仅在实际需要的时间内保留您的个人信息，在达到目的或您要求删除后，将按要求删除或匿名化处理。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                5. 第三方与信息共享
              </h2>
              <p>
                我们不会出售您的个人信息。为提供服务，我们可能将必要数据委托给受严格合同约束的服务提供商（如云存储、数据库与邮件服务），他们仅能按我们指示处理数据，不得用于自身营销或再对外共享。若法律或有权机关依法要求我们提供信息，我们将在法律允许范围内配合并尽量通知您。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                6. 您的权利
              </h2>
              <p>您对自己的个人信息享有以下权利，我们将在合理期限内响应：</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong className="text-gray-900 dark:text-white">查询与更正</strong>：了解我们持有的您的个人信息，并在发现错误时要求更正；
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">删除</strong>：在符合法律与合同约定的前提下，要求删除您的个人信息；
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">撤回同意</strong>：在依赖您同意的处理活动中，您可随时撤回同意，不影响撤回前的处理合法性。
                </li>
              </ul>
              <p className="mt-4">
                行使上述权利或就隐私问题投诉，请通过本政策末尾的联系方式与我们联系。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                7. 未成年人
              </h2>
              <p>
                本产品不面向未满法定年龄的未成年人主动收集个人信息。若您为未成年人的监护人并发现我们已收集其信息，请与我们联系，我们将尽快删除相关数据。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                8. 政策更新
              </h2>
              <p>
                我们可能适时修订本政策，修订后会在本页更新生效日期。若变更涉及对您个人信息的处理目的或方式产生重大影响，我们会在适用法律要求下通过产品内通知或您留存的联系方式另行告知，并视情况再次征得您的同意。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                9. 联系我们
              </h2>
              <p>
                如您对本政策或您的个人信息处理有任何疑问、意见或请求，请通过本产品内的反馈渠道或您注册时使用的邮箱与我们联系，我们将尽快回复。
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
