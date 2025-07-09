import { useState } from "react";
import { TriviaAPI } from "../utils/api";
import type { QuizConfig } from "../types";
import { STORAGE_KEYS, TRIVIA_CATEGORIES, QUIZ_LIMITS } from "../types";

interface QuizConfigState {
  amount: number;
  category: string;
  difficulty: string;
  type: string;
  isLoading: boolean;
  error: string | null;
}

export default function QuizConfig() {
  const [state, setState] = useState<QuizConfigState>({
    amount: QUIZ_LIMITS.DEFAULT_QUESTIONS,
    category: "",
    difficulty: "",
    type: "",
    isLoading: false,
    error: null,
  });

  const updateAmount = (value: number) => {
    setState((prev) => ({ ...prev, amount: value }));
  };

  const updateField = (field: keyof QuizConfigState, value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const startQuiz = async (config: QuizConfig) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      sessionStorage.removeItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);

      const questions = await TriviaAPI.fetchQuestions(config);

      sessionStorage.setItem(
        STORAGE_KEYS.TRIVIA_QUESTIONS,
        JSON.stringify(questions)
      );
      sessionStorage.setItem(STORAGE_KEYS.QUIZ_CONFIG, JSON.stringify(config));

      window.location.href = import.meta.env.BASE_URL + "/quiz";
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const config: QuizConfig = {
      amount: state.amount,
      category: state.category ? parseInt(state.category) : undefined,
      difficulty: (state.difficulty as "easy" | "medium" | "hard") || undefined,
      type: (state.type as "multiple" | "boolean") || undefined,
    };

    await startQuiz(config);
  };

  const hideError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  if (state.isLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-600 text-center">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Configure Your Quiz
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Number of Questions
          </label>

          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full border-4 border-indigo-200 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-200">
              <span className="text-3xl font-bold text-indigo-800 transition-all duration-200">
                {state.amount}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              You will answer{" "}
              <span className="font-semibold text-indigo-600 transition-all duration-200">
                {state.amount}
              </span>{" "}
              questions
            </p>
          </div>

          <input
            type="range"
            id="amount"
            name="amount"
            min={QUIZ_LIMITS.MIN_QUESTIONS}
            max={QUIZ_LIMITS.MAX_QUESTIONS}
            value={state.amount}
            onChange={(e) => updateAmount(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{QUIZ_LIMITS.MIN_QUESTIONS}</span>
            <span>{QUIZ_LIMITS.MAX_QUESTIONS}</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={state.category}
            onChange={(e) => updateField("category", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Any Category</option>
            {TRIVIA_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <div className="flex space-x-4">
            {[
              { value: "", label: "Any" },
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
              { value: "hard", label: "Hard" },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="difficulty"
                  value={option.value}
                  checked={state.difficulty === option.value}
                  onChange={(e) => updateField("difficulty", e.target.value)}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type
          </label>
          <div className="flex space-x-4">
            {[
              { value: "", label: "Any" },
              { value: "multiple", label: "Multiple Choice" },
              { value: "boolean", label: "True/False" },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  checked={state.type === option.value}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium"
        >
          Start Quiz
        </button>
      </form>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{state.error}</p>
              <button
                onClick={hideError}
                className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
