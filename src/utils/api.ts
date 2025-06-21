import type { QuizConfig, TriviaAPIResponse, TriviaQuestion } from "../types";

const API_BASE_URL = "https://opentdb.com/api.php";

const API_RESPONSE_CODES = {
  SUCCESS: 0,
  NO_RESULTS: 1,
  INVALID_PARAMETER: 2,
  TOKEN_NOT_FOUND: 3,
  TOKEN_EMPTY: 4,
} as const;

const PERCENTAGE_MULTIPLIER = 100;

export class TriviaAPI {
  static async fetchQuestions(config: QuizConfig): Promise<TriviaQuestion[]> {
    const url = new URL(API_BASE_URL);

    url.searchParams.append("amount", config.amount.toString());

    if (config.category) {
      url.searchParams.append("category", config.category.toString());
    }

    if (config.difficulty) {
      url.searchParams.append("difficulty", config.difficulty);
    }

    if (config.type) {
      url.searchParams.append("type", config.type);
    }

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TriviaAPIResponse = await response.json();

      if (data.response_code !== API_RESPONSE_CODES.SUCCESS) {
        throw new Error(this.getErrorMessage(data.response_code));
      }

      return data.results.map((question) => ({
        ...question,
        question: this.decodeHtmlEntities(question.question),
        correct_answer: this.decodeHtmlEntities(question.correct_answer),
        incorrect_answers: question.incorrect_answers.map((answer) =>
          this.decodeHtmlEntities(answer)
        ),
      }));
    } catch (error) {
      console.error("Error fetching trivia questions:", error);
      throw error;
    }
  }

  private static getErrorMessage(responseCode: number): string {
    switch (responseCode) {
      case API_RESPONSE_CODES.NO_RESULTS:
        return "No results found. Try adjusting your search parameters.";
      case API_RESPONSE_CODES.INVALID_PARAMETER:
        return "Invalid parameter. Please check your quiz configuration.";
      case API_RESPONSE_CODES.TOKEN_NOT_FOUND:
        return "Token not found. Please try again.";
      case API_RESPONSE_CODES.TOKEN_EMPTY:
        return "Token empty. All possible questions have been exhausted.";
      default:
        return "Unknown error occurred while fetching questions.";
    }
  }

  private static decodeHtmlEntities(text: string): string {
    const textArea = document.createElement("textarea");
    textArea.innerHTML = text;
    return textArea.value;
  }
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function formatQuestionNumber(current: number, total: number): string {
  return `Question ${current + 1} of ${total}`;
}

export function calculatePercentage(score: number, total: number): number {
  return Math.round((score / total) * PERCENTAGE_MULTIPLIER);
}
