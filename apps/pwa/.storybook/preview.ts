import type { Preview } from "@storybook/react";
import React from "react";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => {
      return React.createElement(
        "div",
        { className: "min-h-screen bg-gray-50 dark:bg-gray-900 p-8" },
        React.createElement(Story)
      );
    },
  ],
};

export default preview;
