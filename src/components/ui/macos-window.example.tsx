/**
 * Example usage of MacOSWindow component
 * 
 * This file demonstrates how to use the MacOSWindow component.
 * It's not meant to be imported - just for reference.
 */

import { MacOSWindow } from "./macos-window";

// Basic usage
export function BasicExample() {
  return (
    <MacOSWindow title="My Window">
      <div className="p-6">
        <p>Window content goes here</p>
      </div>
    </MacOSWindow>
  );
}

// With callbacks
export function WithCallbacksExample() {
  return (
    <MacOSWindow
      title="Settings"
      onClose={() => {
        // Handle close action
      }}
      onMinimize={() => {
        // Handle minimize action
      }}
      onMaximize={() => {
        // Handle maximize action
      }}
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        <p>Your settings content here</p>
      </div>
    </MacOSWindow>
  );
}

// Custom styling
export function CustomStyledExample() {
  return (
    <MacOSWindow
      title="Custom Window"
      className="w-full max-w-2xl"
      contentClassName="p-8 bg-gray-50 dark:bg-gray-900"
    >
      <div>
        <h3 className="text-xl font-bold mb-4">Custom Content</h3>
        <p className="text-gray-600 dark:text-gray-400">
          This window has custom styling applied.
        </p>
      </div>
    </MacOSWindow>
  );
}
