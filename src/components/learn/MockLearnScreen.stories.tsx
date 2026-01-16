import type { Meta, StoryObj } from "@storybook/react";
import { MockLearnScreen } from "./MockLearnScreen";
import { MacOSWindow } from "@/components/container/MacOSWindow";
import { IPadFrame } from "@/components/container/IPadFrame";
import { IPhoneFrame } from "@/components/container/IPhoneFrame";

const meta: Meta<typeof MockLearnScreen> = {
  title: "Learn/MockLearnScreen",
  component: MockLearnScreen,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MockLearnScreen>;

export const Default: Story = {
  render: () => (
    <div className="h-screen w-full">
      <MockLearnScreen />
    </div>
  ),
};

export const InMacOSWindow: Story = {
  render: () => (
    <div className="h-[800px] w-[1100px] p-4">
      <MacOSWindow
        title="卡片复习"
        width={1100}
        height={800}
        contentClassName="p-0 overflow-hidden"
      >
        <MockLearnScreen />
      </MacOSWindow>
    </div>
  ),
  parameters: {
    layout: "centered",
  },
};

export const InMacOSWindowScaled: Story = {
  render: () => (
    <div className="h-[600px] w-[825px] p-4">
      <MacOSWindow
        title="卡片复习"
        width={1100}
        height={800}
        scale={0.75}
        contentClassName="p-0 overflow-hidden"
      >
        <MockLearnScreen />
      </MacOSWindow>
    </div>
  ),
  parameters: {
    layout: "centered",
  },
};

export const InIPadFrame: Story = {
  render: () => (
    <div className="h-[768px] w-[1024px] p-4 flex items-center justify-center">
      <IPadFrame orientation="landscape">
        <MockLearnScreen />
      </IPadFrame>
    </div>
  ),
  parameters: {
    layout: "centered",
  },
};

export const InIPadFrameScaled: Story = {
  render: () => (
    <div className="h-[576px] w-[768px] p-4 flex items-center justify-center">
      <IPadFrame orientation="landscape" scale={0.75}>
        <MockLearnScreen />
      </IPadFrame>
    </div>
  ),
  parameters: {
    layout: "centered",
  },
};

export const InIPhoneFrame: Story = {
  render: () => (
    <div className="h-[812px] w-[375px] p-4 flex items-center justify-center">
      <IPhoneFrame>
        <MockLearnScreen />
      </IPhoneFrame>
    </div>
  ),
  parameters: {
    layout: "centered",
  },
};

export const InIPhoneFrameScaled: Story = {
  render: () => (
    <div className="h-[609px] w-[281px] p-4 flex items-center justify-center">
      <IPhoneFrame scale={0.75}>
        <MockLearnScreen />
      </IPhoneFrame>
    </div>
  ),
  parameters: {
    layout: "centered",
  },
};
