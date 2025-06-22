import type { TriviaQuestion, QuizState } from "../types";
import { STORAGE_KEYS } from "../types";
import { toggleElementVisibility, setElementText, redirectToHome } from "../utils/dom";

interface QuizReviewElements {
  reviewContent: HTMLDivElement;
  reviewFinalScore: HTMLParagraphElement;
  reviewQuestions: HTMLDivElement;
  reviewLoading: HTMLDivElement;
  reviewError: HTMLDivElement;
  reviewHeaderNewQuizButton: HTMLButtonElement;
  reviewBottomNewQuizButton: HTMLButtonElement;
  reviewErrorNewQuizButton: HTMLButtonElement;
}

export class QuizReviewManager {
  private elements: QuizReviewElements;
  private questions: TriviaQuestion[] = [];
  private quizState: QuizState | null = null;
  private shuffledOptions: string[][] = [];

  constructor() {
    this.elements = this.getDOMElements();
    this.setupEventListeners();
    this.initializeReview();
  }

  private getDOMElements(): QuizReviewElements {
    return {
      reviewContent: document.getElementById(
        "review-content"
      ) as HTMLDivElement,
      reviewFinalScore: document.getElementById(
        "review-final-score"
      ) as HTMLParagraphElement,
      reviewQuestions: document.getElementById(
        "review-questions"
      ) as HTMLDivElement,
      reviewLoading: document.getElementById(
        "review-loading"
      ) as HTMLDivElement,
      reviewError: document.getElementById("review-error") as HTMLDivElement,
      reviewHeaderNewQuizButton: document.getElementById(
        "review-header-new-quiz-button"
      ) as HTMLButtonElement,
      reviewBottomNewQuizButton: document.getElementById(
        "review-bottom-new-quiz-button"
      ) as HTMLButtonElement,
      reviewErrorNewQuizButton: document.getElementById(
        "review-error-new-quiz-button"
      ) as HTMLButtonElement,
    };
  }

  private setupEventListeners(): void {
    this.elements.reviewHeaderNewQuizButton.addEventListener(
      "click",
      redirectToHome
    );
    this.elements.reviewBottomNewQuizButton.addEventListener(
      "click",
      redirectToHome
    );
    this.elements.reviewErrorNewQuizButton.addEventListener(
      "click",
      redirectToHome
    );
  }

  private initializeReview(): void {
    try {
      const reviewDataStr = sessionStorage.getItem(
        STORAGE_KEYS.QUIZ_REVIEW_DATA
      );

      if (!reviewDataStr) {
        this.showError();
        return;
      }

      const reviewData = JSON.parse(reviewDataStr);
      this.questions = reviewData.questions;
      this.quizState = reviewData.quizState;
      this.shuffledOptions = reviewData.shuffledOptions;

      if (!this.questions || !this.quizState || this.questions.length === 0) {
        this.showError();
        return;
      }

      this.hideLoading();
      this.displayReview();
    } catch (error) {
      console.error("Error initializing review:", error);
      this.showError();
    }
  }

  private displayReview(): void {
    if (!this.quizState) return;

    setElementText(
      this.elements.reviewFinalScore,
      `${this.quizState.score}/${this.questions.length}`
    );

    this.displayAllQuestions();
  }

  private displayAllQuestions(): void {
    if (!this.quizState) return;

    this.elements.reviewQuestions.innerHTML = "";

    this.questions.forEach((question, index) => {
      const questionDiv = document.createElement("div");
      questionDiv.className = "bg-white rounded-lg shadow-lg p-6";

      const userAnswer = this.quizState!.userAnswers[index];
      const isCorrect = userAnswer === question.correct_answer;
      const options = this.shuffledOptions[index];

      questionDiv.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-lg font-semibold text-gray-800">Question ${
                index + 1
              }</span>
              <span class="px-2 py-1 rounded-full text-xs font-medium ${this.getDifficultyColor(
                question.difficulty
              )}">
                ${
                  question.difficulty.charAt(0).toUpperCase() +
                  question.difficulty.slice(1)
                }
              </span>
            </div>
            <p class="text-sm text-gray-600">${question.category}</p>
          </div>
          <div class="flex items-center">
            ${
              isCorrect
                ? '<svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'
                : '<svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>'
            }
          </div>
        </div>
        
        <h3 class="text-lg font-semibold text-gray-800 mb-4 leading-relaxed">
          ${question.question}
        </h3>
        
        <div class="space-y-2">
          ${options
            .map((option) => {
              let optionClass = "p-3 border rounded-lg text-sm";
              let optionLabel = "";

              if (option === question.correct_answer) {
                optionClass += " border-green-500 bg-green-50 text-green-800";
                optionLabel = " ✓ Correct Answer";
              } else if (option === userAnswer && !isCorrect) {
                optionClass += " border-red-500 bg-red-50 text-red-800";
                optionLabel = " ✗ Your Answer";
              } else {
                optionClass += " border-gray-200 bg-gray-50 text-gray-600";
              }

              return `<div class="${optionClass}">
              <span>${option}</span>
              <span class="font-medium">${optionLabel}</span>
            </div>`;
            })
            .join("")}
        </div>
        
        ${
          !isCorrect && userAnswer
            ? `
          <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm text-blue-800">
              <span class="font-medium">Explanation:</span> The correct answer is "${question.correct_answer}".
            </p>
          </div>
        `
            : ""
        }
      `;

      this.elements.reviewQuestions.appendChild(questionDiv);
    });
  }

  private getDifficultyColor(difficulty: string): string {
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
  }

  private hideLoading(): void {
    toggleElementVisibility(this.elements.reviewLoading, false);
    toggleElementVisibility(this.elements.reviewContent, true);
  }

  private showError(): void {
    toggleElementVisibility(this.elements.reviewLoading, false);
    toggleElementVisibility(this.elements.reviewError, true);
  }
}
