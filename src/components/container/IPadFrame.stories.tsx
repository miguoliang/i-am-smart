import type { Meta, StoryObj } from "@storybook/react";
import { IPadFrame } from "./IPadFrame";

const meta: Meta<typeof IPadFrame> = {
  title: "Container/IPadFrame",
  component: IPadFrame,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof IPadFrame>;

export const Default: Story = {
  render: () => (
    <IPadFrame>
      <div className="p-8 space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          This is content inside an iPad frame.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-blue-100 dark:bg-blue-900 rounded-lg" />
          <div className="h-32 bg-green-100 dark:bg-green-900 rounded-lg" />
          <div className="h-32 bg-purple-100 dark:bg-purple-900 rounded-lg" />
          <div className="h-32 bg-orange-100 dark:bg-orange-900 rounded-lg" />
        </div>
      </div>
    </IPadFrame>
  ),
};

export const Dark: Story = {
  render: () => (
    <IPadFrame variant="dark">
      <div className="p-8 space-y-6">
        <h1 className="text-4xl font-bold text-white">
          Dark Mode
        </h1>
        <p className="text-lg text-gray-400">
          iPad frame in dark variant.
        </p>
      </div>
    </IPadFrame>
  ),
};

export const WithCard: Story = {
  render: () => (
    <IPadFrame>
      <div className="p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Card Title
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This is a card component inside the iPad frame.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Another Card
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Multiple cards can be displayed on the larger iPad screen.
          </p>
        </div>
      </div>
    </IPadFrame>
  ),
};

export const Landscape: Story = {
  render: () => (
    <IPadFrame orientation="landscape">
      <div className="p-8 space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Landscape Mode
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          iPad frame in landscape orientation.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-32 bg-blue-100 dark:bg-blue-900 rounded-lg" />
          <div className="h-32 bg-green-100 dark:bg-green-900 rounded-lg" />
          <div className="h-32 bg-purple-100 dark:bg-purple-900 rounded-lg" />
        </div>
      </div>
    </IPadFrame>
  ),
};

export const ScaleSmall: Story = {
  render: () => (
    <IPadFrame scale={0.25}>
      <div className="p-8 space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Small Scale (0.25)
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          iPad frame scaled to 25% of its original size.
        </p>
      </div>
    </IPadFrame>
  ),
};

export const ScaleMedium: Story = {
  render: () => (
    <IPadFrame scale={0.5}>
      <div className="p-8 space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Medium Scale (0.5)
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          iPad frame scaled to 50% of its original size.
        </p>
      </div>
    </IPadFrame>
  ),
};

export const ScaleLarge: Story = {
  render: () => (
    <IPadFrame scale={0.75}>
      <div className="p-8 space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Large Scale (0.75)
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          iPad frame scaled to 75% of its original size.
        </p>
      </div>
    </IPadFrame>
  ),
};

export const ScaleExtraLarge: Story = {
  render: () => (
    <IPadFrame scale={1.25}>
      <div className="p-8 space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Extra Large Scale (1.25)
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          iPad frame scaled to 125% of its original size.
        </p>
      </div>
    </IPadFrame>
  ),
};
