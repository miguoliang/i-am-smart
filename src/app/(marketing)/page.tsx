import Link from "next/link";
import { Button } from "@/components/form/Button";
import { MacOSWindow } from "@/components/container/MacOSWindow";
import { IPhoneFrame } from "@/components/container/IPhoneFrame";
import { IPadFrame } from "@/components/container/IPadFrame";
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
    </div>
  );
}
