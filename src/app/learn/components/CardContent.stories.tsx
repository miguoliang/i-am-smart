import type { Meta, StoryObj } from "@storybook/react";
import { CardContent } from "./CardContent";
import type { Knowledge } from "../types";

const meta: Meta<typeof CardContent> = {
  title: "Learn/CardContent",
  component: CardContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CardContent>;

const mockKnowledge: Knowledge = {
  code: "hello",
  name: "Hello",
  description: "A greeting used to say hi or welcome someone",
  metadata: {},
};

const mockKnowledgeLong: Knowledge = {
  code: "supercalifragilisticexpialidocious",
  name: "Supercalifragilisticexpialidocious",
  description: "An extraordinarily long word meaning fantastic or wonderful",
  metadata: {},
};

const mockKnowledgePhrase: Knowledge = {
  code: "how-are-you",
  name: "How are you?",
  description: "A common greeting asking about someone's well-being or state",
  metadata: {},
};

export const FrontSide: Story = {
  args: {
    knowledge: mockKnowledge,
    side: "front",
    onSpeak: (text, lang) => {
      // eslint-disable-next-line no-console
      console.log(`Speaking: ${text} in ${lang}`);
    },
  },
  render: (args) => (
    <div className="w-[600px] h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex items-center justify-center">
      <CardContent {...args} />
    </div>
  ),
};

export const BackSide: Story = {
  args: {
    knowledge: mockKnowledge,
    side: "back",
  },
  render: (args) => (
    <div className="w-[600px] h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex items-center justify-center">
      <CardContent {...args} />
    </div>
  ),
};

export const LongWordFront: Story = {
  args: {
    knowledge: mockKnowledgeLong,
    side: "front",
    onSpeak: (text, lang) => {
      // eslint-disable-next-line no-console
      console.log(`Speaking: ${text} in ${lang}`);
    },
  },
  render: (args) => (
    <div className="w-[600px] h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex items-center justify-center">
      <CardContent {...args} />
    </div>
  ),
};

export const LongWordBack: Story = {
  args: {
    knowledge: mockKnowledgeLong,
    side: "back",
  },
  render: (args) => (
    <div className="w-[600px] h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex items-center justify-center">
      <CardContent {...args} />
    </div>
  ),
};

export const PhraseFront: Story = {
  args: {
    knowledge: mockKnowledgePhrase,
    side: "front",
    onSpeak: (text, lang) => {
      // eslint-disable-next-line no-console
      console.log(`Speaking: ${text} in ${lang}`);
    },
  },
  render: (args) => (
    <div className="w-[600px] h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex items-center justify-center">
      <CardContent {...args} />
    </div>
  ),
};

export const PhraseBack: Story = {
  args: {
    knowledge: mockKnowledgePhrase,
    side: "back",
  },
  render: (args) => (
    <div className="w-[600px] h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex items-center justify-center">
      <CardContent {...args} />
    </div>
  ),
};

export const WithoutSpeak: Story = {
  args: {
    knowledge: mockKnowledge,
    side: "front",
  },
  render: (args) => (
    <div className="w-[600px] h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex items-center justify-center">
      <CardContent {...args} />
    </div>
  ),
};
