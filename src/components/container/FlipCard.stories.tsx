import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FlipCard } from "./FlipCard";
import { logger } from "@/lib/utils/logger";

const meta: Meta<typeof FlipCard> = {
  title: "Container/FlipCard",
  component: FlipCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FlipCard>;

export const FrontSide: Story = {
  args: {
    front: (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-4xl md:text-6xl font-bold mb-4 text-center">Front Side</h2>
        <p className="text-lg text-muted-foreground text-center">
          This is the front of the card
        </p>
      </div>
    ),
    back: (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-4xl md:text-6xl font-bold mb-4 text-center">Back Side</h2>
        <p className="text-lg text-muted-foreground text-center">
          This is the back of the card
        </p>
      </div>
    ),
    flipped: false,
    onFlip: () => {
      logger.debug("Card flipped");
    },
    onTouchStart: () => {},
    onTouchEnd: () => {},
  },
  render: (args) => (
    <div className="w-full max-w-2xl">
      <FlipCard {...args} />
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};

export const BackSide: Story = {
  args: {
    front: (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-4xl md:text-6xl font-bold mb-4 text-center">Front Side</h2>
        <p className="text-lg text-muted-foreground text-center">
          This is the front of the card
        </p>
      </div>
    ),
    back: (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-4xl md:text-6xl font-bold mb-4 text-center">Back Side</h2>
        <p className="text-lg text-muted-foreground text-center">
          This is the back of the card
        </p>
      </div>
    ),
    flipped: true,
    onFlip: () => {
      logger.debug("Card flipped");
    },
    onTouchStart: () => {},
    onTouchEnd: () => {},
  },
  render: (args) => (
    <div className="w-full max-w-2xl">
      <FlipCard {...args} />
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};

function InteractiveStory() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="w-full max-w-2xl">
      <FlipCard
        front={
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-center">Question?</h2>
            <p className="text-lg text-muted-foreground text-center">
              Click to reveal the answer
            </p>
          </div>
        }
        back={
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-center">Answer!</h2>
            <p className="text-lg text-muted-foreground text-center">
              This is the answer to the question
            </p>
          </div>
        }
        flipped={flipped}
        onFlip={() => setFlipped(!flipped)}
        onTouchStart={() => {}}
        onTouchEnd={() => {}}
      />
      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Click the card to flip it
      </p>
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveStory />,
  parameters: {
    layout: "padded",
  },
};

export const LongText: Story = {
  args: {
    front: (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-center">
          Long Text Content
        </h2>
        <p className="text-base md:text-lg text-muted-foreground text-center max-w-lg">
          This card demonstrates how the FlipCard component handles longer text content.
          The content should wrap properly and remain readable even with extensive text.
        </p>
      </div>
    ),
    back: (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-center">
          Additional Information
        </h2>
        <p className="text-base md:text-lg text-muted-foreground text-center max-w-lg">
          The back side can also contain longer text. The component handles both sides
          independently, allowing for flexible content layouts and varying amounts of text.
        </p>
      </div>
    ),
    flipped: false,
    onFlip: () => {
      logger.debug("Card flipped");
    },
    onTouchStart: () => {},
    onTouchEnd: () => {},
  },
  render: (args) => (
    <div className="w-full max-w-2xl">
      <FlipCard {...args} />
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};

export const WithIcons: Story = {
  args: {
    front: (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-6xl mb-6">🎴</div>
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-center">Card Front</h2>
        <p className="text-muted-foreground text-center">With icon content</p>
      </div>
    ),
    back: (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-6xl mb-6">🔄</div>
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-center">Card Back</h2>
        <p className="text-muted-foreground text-center">Flipped content</p>
      </div>
    ),
    flipped: false,
    onFlip: () => {
      logger.debug("Card flipped");
    },
    onTouchStart: () => {},
    onTouchEnd: () => {},
  },
  render: (args) => (
    <div className="w-full max-w-2xl">
      <FlipCard {...args} />
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};

function FlipAnimationStory() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="w-full max-w-2xl space-y-4">
      <FlipCard
        front={
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-center">Front</h2>
            <p className="text-muted-foreground text-center">Click to flip</p>
          </div>
        }
        back={
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-center">Back</h2>
            <p className="text-muted-foreground text-center">Flipped!</p>
          </div>
        }
        flipped={flipped}
        onFlip={() => setFlipped(!flipped)}
        onTouchStart={() => {}}
        onTouchEnd={() => {}}
      />
      <div className="text-center">
        <button
          onClick={() => setFlipped(!flipped)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {flipped ? "Show Front" : "Show Back"}
        </button>
      </div>
    </div>
  );
}

export const FlipAnimation: Story = {
  render: () => <FlipAnimationStory />,
  parameters: {
    layout: "padded",
  },
};

export const CustomContent: Story = {
  args: {
    front: (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-4xl font-bold mb-4">Custom Front</h2>
        <p className="text-muted-foreground">This is custom content</p>
        <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <p className="text-sm">Any React content can go here</p>
        </div>
      </div>
    ),
    back: (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-4xl font-bold mb-4">Custom Back</h2>
        <p className="text-muted-foreground">FlipCard doesn&apos;t care what content it displays</p>
        <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
          <p className="text-sm">You can use any components or elements</p>
        </div>
      </div>
    ),
    flipped: false,
    onFlip: () => {
      logger.debug("Card flipped");
    },
    onTouchStart: () => {},
    onTouchEnd: () => {},
  },
  render: (args) => (
    <div className="w-full max-w-2xl">
      <FlipCard {...args} />
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};

export const MinimalContent: Story = {
  args: {
    front: (
      <div className="flex items-center justify-center h-full">
        <span className="text-6xl font-bold">A</span>
      </div>
    ),
    back: (
      <div className="flex items-center justify-center h-full">
        <span className="text-6xl font-bold">B</span>
      </div>
    ),
    flipped: false,
    onFlip: () => {
      logger.debug("Card flipped");
    },
    onTouchStart: () => {},
    onTouchEnd: () => {},
  },
  render: (args) => (
    <div className="w-full max-w-2xl">
      <FlipCard {...args} />
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
