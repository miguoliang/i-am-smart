"use client";

import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  items: string[];
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  title,
  items,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (items.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white">
          {title}
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {isOpen ? "↑" : "↓"}
        </span>
      </button>
      {isOpen && (
        <ul className="pb-4 space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-gray-200 dark:border-gray-800"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
