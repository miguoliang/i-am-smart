import type { Meta, StoryObj } from "@storybook/react";
import { MacOSWindow } from "./MacOSWindow";
import { Button } from "@/components/form/Button";

const meta: Meta<typeof MacOSWindow> = {
  title: "Container/MacOSWindow",
  component: MacOSWindow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MacOSWindow>;

export const Default: Story = {
  args: {
    title: "My Window",
    children: (
      <div className="p-6">
        <p className="text-gray-700 dark:text-gray-300">
          This is a basic macOS-style window with traffic light buttons.
        </p>
      </div>
    ),
  },
};

export const WithContent: Story = {
  args: {
    title: "Window with Content",
    children: (
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Window Content
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This window contains various content elements.
        </p>
        <div className="flex gap-2">
          <Button>Action 1</Button>
          <Button variant="outline">Action 2</Button>
        </div>
      </div>
    ),
  },
};

export const CustomStyled: Story = {
  args: {
    title: "Custom Styled Window",
    className: "max-w-2xl",
    contentClassName:
      "p-8 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800",
    children: (
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Custom Styling
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This window has custom styling applied to both the container and content area.
        </p>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You can customize the window using the{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
              className
            </code>{" "}
            and{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
              contentClassName
            </code>{" "}
            props.
          </p>
        </div>
      </div>
    ),
  },
};

export const LongContent: Story = {
  args: {
    title: "Window with Scrollable Content",
    className: "w-full max-w-md h-96",
    children: (
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Scrollable Content
        </h3>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-gray-600 dark:text-gray-400">
            This is paragraph {i + 1}. The window content area is scrollable when
            content exceeds the available space.
          </p>
        ))}
      </div>
    ),
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  args: {
    title: "Dark Mode Window",
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Dark Mode Support
        </h3>
        <p className="text-gray-300">
          The macOS window component fully supports dark mode with proper color schemes.
        </p>
      </div>
    ),
  },
};

export const ScaleSmall: Story = {
  args: {
    title: "Small Scale (0.5)",
    width: 600,
    height: 400,
    scale: 0.5,
    children: (
      <div className="p-6">
        <p className="text-gray-700 dark:text-gray-300">
          This window is scaled to 50% of its original size.
        </p>
      </div>
    ),
  },
};

export const ScaleMedium: Story = {
  args: {
    title: "Medium Scale (0.75)",
    width: 600,
    height: 400,
    scale: 0.75,
    children: (
      <div className="p-6">
        <p className="text-gray-700 dark:text-gray-300">
          This window is scaled to 75% of its original size.
        </p>
      </div>
    ),
  },
};

export const ScaleLarge: Story = {
  args: {
    title: "Large Scale (1.25)",
    width: 600,
    height: 400,
    scale: 1.25,
    children: (
      <div className="p-6">
        <p className="text-gray-700 dark:text-gray-300">
          This window is scaled to 125% of its original size.
        </p>
      </div>
    ),
  },
};
