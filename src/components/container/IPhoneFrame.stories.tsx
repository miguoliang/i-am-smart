import type { Meta, StoryObj } from "@storybook/react";
import { IPhoneFrame } from "./IPhoneFrame";

const meta: Meta<typeof IPhoneFrame> = {
  title: "Container/IPhoneFrame",
  component: IPhoneFrame,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof IPhoneFrame>;

export const Default: Story = {
  render: () => (
    <IPhoneFrame>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This is content inside an iPhone frame.
        </p>
        <div className="space-y-2">
          <div className="h-20 bg-blue-100 dark:bg-blue-900 rounded-lg" />
          <div className="h-20 bg-green-100 dark:bg-green-900 rounded-lg" />
          <div className="h-20 bg-purple-100 dark:bg-purple-900 rounded-lg" />
        </div>
      </div>
    </IPhoneFrame>
  ),
};

export const Dark: Story = {
  render: () => (
    <IPhoneFrame variant="dark">
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-white">
          Dark Mode
        </h1>
        <p className="text-gray-400">
          iPhone frame in dark variant.
        </p>
      </div>
    </IPhoneFrame>
  ),
};

export const WithCard: Story = {
  render: () => (
    <IPhoneFrame>
      <div className="p-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Card Title
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This is a card component inside the iPhone frame.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Another Card
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Multiple cards can be displayed.
          </p>
        </div>
      </div>
    </IPhoneFrame>
  ),
};
