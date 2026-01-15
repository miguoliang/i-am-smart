import type { Meta, StoryObj } from "@storybook/react";
import { Desktop } from "./Desktop";
import { MacOSWindow } from "./MacOSWindow";
import { IPhoneFrame } from "./IPhoneFrame";
import { IPadFrame } from "./IPadFrame";

const meta: Meta<typeof Desktop> = {
  title: "Container/Desktop",
  component: Desktop,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Desktop>;

export const Default: Story = {
  render: () => (
    <Desktop className="h-screen">
      <MacOSWindow
        title="Window 1"
        width={384}
        height={256}
        defaultPosition={{ x: 50, y: 50 }}
      >
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">
            Drag me by the title bar!
          </p>
        </div>
      </MacOSWindow>
      <MacOSWindow
        title="Window 2"
        width={320}
        height={224}
        defaultPosition={{ x: 200, y: 150 }}
      >
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">
            I can also be dragged around.
          </p>
        </div>
      </MacOSWindow>
    </Desktop>
  ),
};

export const SingleWindow: Story = {
  render: () => (
    <Desktop className="h-screen">
      <MacOSWindow
        title="Card Review"
        width={500}
        height={400}
        defaultPosition={{ x: 100, y: 100 }}
      >
        <div className="min-h-full flex items-center justify-center p-8">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            卡片复习界面预览
          </p>
        </div>
      </MacOSWindow>
    </Desktop>
  ),
};

export const WithIPhoneFrame: Story = {
  render: () => (
    <Desktop className="h-screen">
      <MacOSWindow
        title="Desktop App"
        width={600}
        height={400}
        defaultPosition={{ x: 50, y: 50 }}
        contentClassName="p-8 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800"
      >
        <div className="min-h-full flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            桌面应用界面
          </p>
        </div>
      </MacOSWindow>
      <IPhoneFrame
        defaultPosition={{ x: 500, y: 100 }}
      >
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            移动学习
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            随时随地学习
          </p>
        </div>
      </IPhoneFrame>
    </Desktop>
  ),
};

export const WithScale: Story = {
  render: () => (
    <Desktop className="h-screen">
      <MacOSWindow
        title="Normal Size"
        width={600}
        height={400}
        scale={1}
        defaultPosition={{ x: 50, y: 50 }}
        contentClassName="p-8 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800"
      >
        <div className="min-h-full flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            正常大小 (600x400)
          </p>
        </div>
      </MacOSWindow>
      <MacOSWindow
        title="Scaled 75%"
        width={600}
        height={400}
        scale={0.75}
        defaultPosition={{ x: 400, y: 100 }}
        contentClassName="p-8 bg-linear-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800"
      >
        <div className="min-h-full flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            缩放 75% (450x300)
          </p>
        </div>
      </MacOSWindow>
      <MacOSWindow
        title="Scaled 50%"
        width={600}
        height={400}
        scale={0.5}
        defaultPosition={{ x: 200, y: 300 }}
        contentClassName="p-8 bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800"
      >
        <div className="min-h-full flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            缩放 50% (300x200)
          </p>
        </div>
      </MacOSWindow>
    </Desktop>
  ),
};

export const WithScaledFrames: Story = {
  render: () => (
    <Desktop className="h-screen">
      <MacOSWindow
        title="卡片复习"
        width={600}
        height={400}
        scale={0.75}
        defaultPosition={{ x: 50, y: 50 }}
        contentClassName="p-8 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800"
      >
        <div className="min-h-full flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            桌面应用界面 (75% scale)
          </p>
        </div>
      </MacOSWindow>
      <IPhoneFrame
        scale={0.75}
        defaultPosition={{ x: 400, y: 100 }}
      >
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            移动学习
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            随时随地学习 (75% scale)
          </p>
        </div>
      </IPhoneFrame>
      <IPadFrame
        orientation="landscape"
        scale={0.75}
        defaultPosition={{ x: 200, y: 200 }}
      >
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            平板学习
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            大屏体验，更舒适的学习 (75% scale)
          </p>
        </div>
      </IPadFrame>
    </Desktop>
  ),
};
