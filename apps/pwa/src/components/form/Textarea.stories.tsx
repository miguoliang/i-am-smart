import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { Label } from "./Label";

const meta = {
  title: "Form/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter your message...",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-[350px]">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Type your message here." />
    </div>
  ),
};

export const WithValue: Story = {
  args: {
    value: "This is a pre-filled textarea with some content.",
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <Textarea placeholder="Disabled textarea" disabled />
      <Textarea
        placeholder="Disabled with value"
        disabled
        value="This textarea is disabled and has a value."
      />
    </div>
  ),
};

export const Rows: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <div className="space-y-2">
        <Label>Small (3 rows)</Label>
        <Textarea placeholder="Small textarea" rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Medium (6 rows)</Label>
        <Textarea placeholder="Medium textarea" rows={6} />
      </div>
      <div className="space-y-2">
        <Label>Large (10 rows)</Label>
        <Textarea placeholder="Large textarea" rows={10} />
      </div>
    </div>
  ),
};
