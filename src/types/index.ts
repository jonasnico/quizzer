export interface TriviaQuestion {
  category: string;
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface TriviaAPIResponse {
  response_code: number;
  results: TriviaQuestion[];
}

export interface QuizConfig {
  amount: number;
  category?: number;
  difficulty?: "easy" | "medium" | "hard";
  type?: "multiple" | "boolean";
}

export interface QuizState {
  questions: TriviaQuestion[];
  currentQuestionIndex: number;
  score: number;
  userAnswers: string[];
}

export interface Category {
  id: number;
  name: string;
}

export const TRIVIA_CATEGORIES: Category[] = [
  { id: 9, name: "General Knowledge" },
  { id: 10, name: "Entertainment: Books" },
  { id: 11, name: "Entertainment: Film" },
  { id: 12, name: "Entertainment: Music" },
  { id: 13, name: "Entertainment: Musicals & Theatres" },
  { id: 14, name: "Entertainment: Television" },
  { id: 15, name: "Entertainment: Video Games" },
  { id: 16, name: "Entertainment: Board Games" },
  { id: 17, name: "Science & Nature" },
  { id: 18, name: "Science: Computers" },
  { id: 19, name: "Science: Mathematics" },
  { id: 20, name: "Mythology" },
  { id: 21, name: "Sports" },
  { id: 22, name: "Geography" },
  { id: 23, name: "History" },
  { id: 24, name: "Politics" },
  { id: 25, name: "Art" },
  { id: 26, name: "Celebrities" },
  { id: 27, name: "Animals" },
  { id: 28, name: "Vehicles" },
  { id: 29, name: "Entertainment: Comics" },
  { id: 30, name: "Science: Gadgets" },
  { id: 31, name: "Entertainment: Japanese Anime & Manga" },
  { id: 32, name: "Entertainment: Cartoon & Animations" },
];

export const QUIZ_LIMITS = {
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 50,
  DEFAULT_QUESTIONS: 10,
} as const;

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
} as const;

export const STORAGE_KEYS = {
  TRIVIA_QUESTIONS: "triviaQuestions",
  QUIZ_CONFIG: "quizConfig",
} as const;
