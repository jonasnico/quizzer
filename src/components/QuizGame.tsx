import { useState, useEffect } from "react";
import {
  shuffleArray,
  formatQuestionNumber,
  calculatePercentage,
} from "../utils/api";
import type { TriviaQuestion, QuizState } from "../types";
import { STORAGE_KEYS, SCORE_THRESHOLDS } from "../types";
import { BUTTON_STYLES, RESULT_ICONS } from "../utils/styles";

interface Toast {
  id: number;
  isCorrect: boolean;
  question: TriviaQuestion;
  selectedAnswer: string;
}

export default function QuizGame() {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    initializeQuiz();
  }, []);

  const initializeQuiz = () => {
    try {
      const questionsData = sessionStorage.getItem(
        STORAGE_KEYS.TRIVIA_QUESTIONS
      );

      if (!questionsData) {
        setHasError(true);
        return;
      }

      const parsedQuestions = JSON.parse(questionsData);

      if (parsedQuestions.length === 0) {
        setHasError(true);
        return;
      }

      const reviewData = sessionStorage.getItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);

      if (reviewData) {
        const parsedReviewData = JSON.parse(reviewData);
        setQuizState(parsedReviewData.quizState);
        setQuestions(parsedReviewData.questions);
        setShuffledOptions(parsedReviewData.shuffledOptions);
        setShowResults(true);
        setIsLoading(false);
        return;
      }

      const initialQuizState: QuizState = {
        questions: parsedQuestions,
        currentQuestionIndex: 0,
        score: 0,
        userAnswers: new Array(parsedQuestions.length).fill(""),
      };

      const initialShuffledOptions = parsedQuestions.map(
        (question: TriviaQuestion) => {
          if (question.type === "boolean") {
            return ["True", "False"];
          } else {
            return shuffleArray([
              question.correct_answer,
              ...question.incorrect_answers,
            ]);
          }
        }
      );

      setQuizState(initialQuizState);
      setQuestions(parsedQuestions);
      setShuffledOptions(initialShuffledOptions);
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing quiz:", error);
      setHasError(true);
    }
  };

  const selectAnswer = (selectedAnswer: string) => {
    if (!quizState) return;

    const question = questions[quizState.currentQuestionIndex];

    if (quizState.userAnswers[quizState.currentQuestionIndex] !== "") {
      return;
    }

    const newUserAnswers = [...quizState.userAnswers];
    newUserAnswers[quizState.currentQuestionIndex] = selectedAnswer;

    let newScore = quizState.score;
    if (selectedAnswer === question.correct_answer) {
      newScore++;
    }

    setQuizState({
      ...quizState,
      score: newScore,
      userAnswers: newUserAnswers,
    });

    showToast(question, selectedAnswer);
  };

  const showToast = (question: TriviaQuestion, selectedAnswer: string) => {
    const isCorrect = selectedAnswer === question.correct_answer;
    const newToast: Toast = {
      id: Date.now(),
      isCorrect,
      question,
      selectedAnswer,
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== newToast.id));
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const goToPreviousQuestion = () => {
    if (!quizState || quizState.currentQuestionIndex === 0) return;
    setQuizState({
      ...quizState,
      currentQuestionIndex: quizState.currentQuestionIndex - 1,
    });
  };

  const goToNextQuestion = () => {
    if (!quizState) return;

    if (quizState.currentQuestionIndex < questions.length - 1) {
      setQuizState({
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex + 1,
      });
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (!quizState) return;

    sessionStorage.setItem(
      STORAGE_KEYS.QUIZ_REVIEW_DATA,
      JSON.stringify({
        questions,
        quizState,
        shuffledOptions,
      })
    );

    setShowResults(true);
  };

  const redirectToHome = () => {
    sessionStorage.removeItem(STORAGE_KEYS.TRIVIA_QUESTIONS);
    sessionStorage.removeItem(STORAGE_KEYS.QUIZ_CONFIG);
    sessionStorage.removeItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);
    window.location.href = import.meta.env.BASE_URL;
  };

  const goToReviewPage = () => {
    window.location.href = import.meta.env.BASE_URL + "/review";
  };

  const getButtonStyle = (
    option: string,
    question: TriviaQuestion,
    hasAnswered: boolean
  ) => {
    if (!quizState) return BUTTON_STYLES.DEFAULT;

    const userAnswer = quizState.userAnswers[quizState.currentQuestionIndex];

    if (userAnswer === option) {
      return option === question.correct_answer
        ? BUTTON_STYLES.CORRECT
        : BUTTON_STYLES.INCORRECT;
    }

    if (hasAnswered && option === question.correct_answer) {
      return BUTTON_STYLES.CORRECT;
    }

    if (hasAnswered) {
      return BUTTON_STYLES.DISABLED;
    }

    return BUTTON_STYLES.DEFAULT;
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
          <p className="mt-4 text-gray-600 text-center">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Quiz Not Found
        </h3>
        <p className="text-gray-600 mb-6">
          No quiz data was found. Please start a new quiz.
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

  if (!quizState) return null;

  if (showResults) {
    const percentage = calculatePercentage(quizState.score, questions.length);

    let resultIcon: string;
    if (percentage >= SCORE_THRESHOLDS.EXCELLENT) {
      resultIcon = RESULT_ICONS.EXCELLENT;
    } else if (percentage >= SCORE_THRESHOLDS.GOOD) {
      resultIcon = RESULT_ICONS.GOOD;
    } else {
      resultIcon = RESULT_ICONS.NEEDS_IMPROVEMENT;
    }

    return (
      <div className="max-w-4xl mx-auto relative">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Quiz Complete
              </h2>
              <p className="text-sm text-gray-600">
                {questions.length} questions answered
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-2xl font-bold text-indigo-600">
                {quizState.score}/{questions.length}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300 w-full"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center">
            <div className="text-6xl mb-4">{resultIcon}</div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Quiz Complete!
            </h3>
            <div className="mb-6">
              <p className="text-xl text-gray-600 mb-2">
                You scored {quizState.score} out of {questions.length}
              </p>
              <p className="text-4xl font-bold text-indigo-600">
                {percentage}%
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={goToReviewPage}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                Review Answers
              </button>
              <button
                onClick={redirectToHome}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                Start New Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[quizState.currentQuestionIndex];
  const questionNumber = quizState.currentQuestionIndex + 1;
  const totalQuestions = questions.length;
  const progressPercentage = (questionNumber / totalQuestions) * 100;
  const hasAnswered =
    quizState.userAnswers[quizState.currentQuestionIndex] !== "";
  const isLastQuestion =
    quizState.currentQuestionIndex === questions.length - 1;
  const options = shuffledOptions[quizState.currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto relative">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {formatQuestionNumber(
                quizState.currentQuestionIndex,
                totalQuestions
              )}
            </h2>
            <p className="text-sm text-gray-600">{currentQuestion.category}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-2xl font-bold text-indigo-600">
              {quizState.score}/{quizState.currentQuestionIndex}
            </p>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="absolute top-28 right-4 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`mb-3 px-4 py-3 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform ${
              toast.isCorrect
                ? "bg-green-50 border-green-400 text-green-800"
                : "bg-red-50 border-red-400 text-red-800"
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <span className="text-lg font-bold">
                  {toast.isCorrect ? "✓" : "✗"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">
                  {toast.isCorrect ? "Correct!" : "Incorrect"}
                </p>
                <p className="text-sm mt-1">
                  {toast.isCorrect
                    ? "Well done!"
                    : `The correct answer is: ${toast.question.correct_answer}`}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${getDifficultyColor(
            currentQuestion.difficulty
          )}`}
        >
          {currentQuestion.difficulty.charAt(0).toUpperCase() +
            currentQuestion.difficulty.slice(1)}
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => selectAnswer(option)}
              disabled={hasAnswered}
              className={getButtonStyle(option, currentQuestion, hasAnswered)}
              style={hasAnswered ? { cursor: "not-allowed" } : {}}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={goToPreviousQuestion}
          disabled={quizState.currentQuestionIndex === 0}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          onClick={goToNextQuestion}
          disabled={!hasAnswered}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastQuestion ? "Finish Quiz" : "Next Question"}
        </button>
      </div>
    </div>
  );
}
