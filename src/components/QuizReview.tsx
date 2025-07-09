import { useState, useEffect } from "react";
import type { TriviaQuestion, QuizState } from "../types";
import { STORAGE_KEYS } from "../types";

interface QuizReviewData {
  questions: TriviaQuestion[];
  quizState: QuizState;
  shuffledOptions: string[][];
}

export default function QuizReview() {
  const [reviewData, setReviewData] = useState<QuizReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    initializeReview();
  }, []);

  const initializeReview = () => {
    try {
      const reviewDataStr = sessionStorage.getItem(
        STORAGE_KEYS.QUIZ_REVIEW_DATA
      );

      if (!reviewDataStr) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const parsedReviewData = JSON.parse(reviewDataStr);

      if (
        !parsedReviewData.questions ||
        !parsedReviewData.quizState ||
        parsedReviewData.questions.length === 0
      ) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      setReviewData(parsedReviewData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing review:", error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const redirectToHome = () => {
    sessionStorage.removeItem(STORAGE_KEYS.TRIVIA_QUESTIONS);
    sessionStorage.removeItem(STORAGE_KEYS.QUIZ_CONFIG);
    sessionStorage.removeItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);
    window.location.href = import.meta.env.BASE_URL;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-600 text-center">
            Loading quiz review...
          </p>
        </div>
      </div>
    );
  }

  if (hasError || !reviewData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No Quiz Data Found
        </h3>
        <p className="text-gray-600 mb-6">
          No completed quiz was found. Please complete a quiz to see the review.
        </p>
        <button
          onClick={redirectToHome}
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Start New Quiz
        </button>
      </div>
    );
  }

  const { questions, quizState, shuffledOptions } = reviewData;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Quiz Review</h2>
            <p className="text-gray-600">Review all questions and answers</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Final Score</p>
            <p className="text-2xl font-bold text-indigo-600">
              {quizState.score}/{quizState.userAnswers.length}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={`${import.meta.env.BASE_URL}/quiz`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            ← Back to Quiz
          </a>
          <button
            onClick={redirectToHome}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Start New Quiz
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const userAnswer = quizState.userAnswers[index];
          const isCorrect = userAnswer === question.correct_answer;
          const options = shuffledOptions[index];

          return (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-gray-800">
                      Question {index + 1}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        question.difficulty
                      )}`}
                    >
                      {question.difficulty.charAt(0).toUpperCase() +
                        question.difficulty.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{question.category}</p>
                </div>
                <div className="flex items-center">
                  {isCorrect ? (
                    <svg
                      className="h-6 w-6 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4 leading-relaxed">
                {question.question}
              </h3>

              <div className="space-y-2">
                {options.map((option) => {
                  let optionClass = "p-3 border rounded-lg text-sm";
                  let optionLabel = "";

                  if (option === question.correct_answer) {
                    optionClass +=
                      " border-green-500 bg-green-50 text-green-800";
                    optionLabel = " ✓ Correct Answer";
                  } else if (option === userAnswer && !isCorrect) {
                    optionClass += " border-red-500 bg-red-50 text-red-800";
                    optionLabel = " ✗ Your Answer";
                  } else {
                    optionClass += " border-gray-200 bg-gray-50 text-gray-600";
                  }

                  return (
                    <div key={option} className={optionClass}>
                      <span>{option}</span>
                      <span className="font-medium">{optionLabel}</span>
                    </div>
                  );
                })}
              </div>

              {!isCorrect && userAnswer && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Explanation:</span> The
                    correct answer is "{question.correct_answer}".
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mt-6 text-center">
        <button
          onClick={redirectToHome}
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Start New Quiz
        </button>
      </div>
    </div>
  );
}
