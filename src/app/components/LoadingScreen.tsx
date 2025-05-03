"use client";

import { FileText } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
      <FileText className="h-16 w-16 text-[#0066FF] dark:text-[#3385FF] mb-4 animate-bounce" />
      <span className="text-xl font-semibold text-gray-900 dark:text-white">
        Loading...
      </span>
    </div>
  );
}