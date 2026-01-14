import type { Meta, StoryObj } from "@storybook/react";
import { Desktop } from "./Desktop";
import { MacOSWindow } from "./MacOSWindow";
import { IPhoneFrame } from "./IPhoneFrame";

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
        className="w-96 h-64"
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
        className="w-80 h-56"
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
        className="w-[500px] h-[400px]"
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
        className="w-[600px] h-[400px]"
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
