export const COMMON_STYLES = {
  BUTTON_BASE:
    "px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500",
  BUTTON_PRIMARY: "bg-indigo-600 text-white hover:bg-indigo-700",
  BUTTON_SECONDARY: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  CARD: "bg-white rounded-lg shadow-lg p-6",
  FEEDBACK_BASE: "mt-6 p-4 rounded-lg",
  FEEDBACK_SUCCESS: "bg-green-50 border border-green-200",
  FEEDBACK_ERROR: "bg-red-50 border border-red-200",
  TEXT_SUCCESS: "font-semibold text-green-800",
  TEXT_ERROR: "font-semibold text-red-800",
  DIFFICULTY_BASE: "px-2 py-1 rounded-full text-xs font-medium",
} as const;

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

export const SVG_ICONS = {
  SUCCESS:
    '<svg class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>',
  ERROR:
    '<svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>',
} as const;
