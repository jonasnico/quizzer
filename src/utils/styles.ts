export const BUTTON_STYLES = {
  DEFAULT:
    "w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
  CORRECT:
    "w-full text-left p-4 border-2 border-green-500 bg-green-50 rounded-lg cursor-not-allowed",
  INCORRECT:
    "w-full text-left p-4 border-2 border-red-500 bg-red-50 rounded-lg cursor-not-allowed",
  DISABLED:
    "w-full text-left p-4 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed",
} as const;

export const RESULT_ICONS = {
  EXCELLENT: "🏆",
  GOOD: "🎉",
  NEEDS_IMPROVEMENT: "📚",
} as const;

export const TOAST_STYLES = {
  BASE: "mb-3 px-4 py-3 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform",
  SUCCESS: "bg-green-50 border-green-400 text-green-800",
  ERROR: "bg-red-50 border-red-400 text-red-800",
} as const;
