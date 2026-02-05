import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateSEOMetadata({
  title: "服务条款",
  description:
    "聪明的背单词工具服务条款：使用本服务即表示您同意遵守本条款，包括账号使用、行为规范、免责与责任限制等。",
  keywords: ["服务条款", "用户协议", "使用条款"],
});

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-white">
            服务条款
          </h1>
          <p className="text-muted-foreground text-sm mb-10">
            生效日期：2026 年 2 月 1 日
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-10">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                1. 接受条款
              </h2>
              <p>
                「聪明的背单词工具」（以下简称「本产品」或「本服务」）由我们（以下简称「我们」或「运营方」）提供。您注册、登录或使用本服务，即表示您已阅读、理解并同意受本服务条款（以下简称「本条款」）约束。若您不同意本条款，请勿使用本服务。若您为未满法定年龄的未成年人，请在监护人同意后再使用。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                2. 服务说明
              </h2>
              <p>
                本产品是一款基于间隔重复算法的英语学习与背单词工具，提供学习内容、复习计划、进度统计及相关功能。我们有权根据运营需要调整、升级或暂停部分或全部服务，并尽可能提前通过产品内公告等方式通知您。部分功能可能需满足特定条件（如登录、订阅等）方可使用。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                3. 账号与使用规范
              </h2>
              <p>
                您应使用真实、准确的信息注册账号并妥善保管账号与密码。您对账号下的全部行为负责。若发现账号被盗用或异常，请及时联系我们。您在使用本服务时，应遵守中华人民共和国相关法律法规及本条款，不得利用本服务从事违法违规或侵害他人权益的行为。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                4. 禁止行为
              </h2>
              <p>在使用本服务时，您不得：</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>利用技术手段干扰、破坏或未经授权访问本服务、服务器或网络；</li>
                <li>传播病毒、恶意代码或实施其他危害网络安全的行为；</li>
                <li>批量注册账号、滥用接口或对服务进行爬取、压测等影响正常运营的行为；</li>
                <li>发布违法信息、侵权内容、虚假信息或骚扰他人；</li>
                <li>反向工程、反编译、破解或以其他方式试图获取本产品源代码或底层逻辑（法律另有允许的除外）；</li>
                <li>将本服务用于任何商业再销售、转授权或与本产品竞争之目的，除非我们书面同意。</li>
              </ul>
              <p className="mt-4">
                我们有权对违反本条款的行为进行调查，并视情节采取警告、限制功能、封禁账号或追究法律责任等措施。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                5. 知识产权
              </h2>
              <p>
                本产品（包括但不限于软件、界面、文案、商标、Logo 及学习内容编排等）所涉知识产权归我们或相关权利人所有。本条款不授予您任何上述权利。您仅可在遵守本条款的前提下，为个人学习目的使用本服务。未经我们书面许可，您不得复制、修改、传播、展示或用于其他用途。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                6. 免责声明
              </h2>
              <p>
                本服务按「现状」和「可用性」提供。我们尽力保障服务稳定与内容准确，但不保证服务不中断、无错误或完全满足您的特定需求。学习效果因人而异，本产品提供的学习建议与统计仅供参考，不构成任何学习成果的保证。您使用本服务及依赖其内容所做的决定，由您自行承担风险。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                7. 责任限制
              </h2>
              <p>
                在法律允许的最大范围内，我们及我们的关联方、合作方对因使用或无法使用本服务而产生的任何直接、间接、附带、特殊、惩罚性或后果性损害（包括但不限于数据丢失、利润损失、业务中断等）不承担责任，无论基于合同、侵权、严格责任或其他法律理论，且无论我们是否已被告知此类损害的可能性。若适用法律不允许排除或限制上述责任，则我们在该法律允许范围内的责任以您就本服务向我们支付的金额（如有）为上限，或如无付费则我们不对您承担赔偿责任。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                8. 服务变更与终止
              </h2>
              <p>
                我们可能因业务调整、合规要求或不可抗力等原因变更、中断或终止部分或全部服务，并尽可能提前通知。您可随时停止使用本服务；若您不再同意本条款，请停止使用并可申请注销账号。我们有权在您严重违反本条款或法律法规时，暂停或终止向您提供服务并保留追究责任的权利。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                9. 条款修改
              </h2>
              <p>
                我们可能适时修订本条款，修订后的条款将在本页公布并更新生效日期。若变更对您的权利或义务产生重大影响，我们会在适用法律要求下通过产品内通知等方式提醒您。若您在本条款修订生效后继续使用本服务，即视为接受修订后的条款；若您不同意，请停止使用本服务。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                10. 适用法律与争议解决
              </h2>
              <p>
                本条款的订立、效力、解释与履行均适用中华人民共和国法律（不含冲突法）。因本条款或本服务产生的争议，双方应尽量友好协商解决；协商不成的，任何一方可将争议提交我们主要经营地有管辖权的人民法院诉讼解决。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                11. 联系我们
              </h2>
              <p>
                如您对本条款有任何疑问或需要行使相关权利，请通过本产品内的反馈渠道或您注册时使用的邮箱与我们联系。我们会在合理期限内予以回复。
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
