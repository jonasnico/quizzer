import {
  shuffleArray,
  formatQuestionNumber,
  calculatePercentage,
} from "../utils/api";
import type { TriviaQuestion, QuizState } from "../types";
import { STORAGE_KEYS, SCORE_THRESHOLDS } from "../types";

const BUTTON_STYLES = {
  DEFAULT:
    "w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
  CORRECT:
    "w-full text-left p-4 border-2 border-green-500 bg-green-50 rounded-lg cursor-not-allowed",
  INCORRECT:
    "w-full text-left p-4 border-2 border-red-500 bg-red-50 rounded-lg cursor-not-allowed",
  DISABLED:
    "w-full text-left p-4 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed",
} as const;

const RESULT_ICONS = {
  EXCELLENT: "🏆",
  GOOD: "🎉",
  NEEDS_IMPROVEMENT: "📚",
} as const;

interface QuizGameElements {
  quizContainer: HTMLDivElement;
  questionCard: HTMLDivElement;
  navigationDiv: HTMLDivElement;
  questionCounter: HTMLHeadingElement;
  categoryDisplay: HTMLParagraphElement;
  scoreDisplay: HTMLParagraphElement;
  progressBar: HTMLDivElement;
  difficultyBadge: HTMLDivElement;
  questionText: HTMLHeadingElement;
  answerOptions: HTMLDivElement;
  feedbackSection: HTMLDivElement;
  feedbackIcon: HTMLDivElement;
  feedbackTitle: HTMLParagraphElement;
  feedbackMessage: HTMLParagraphElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  resultsModal: HTMLDivElement;
  finalScore: HTMLParagraphElement;
  percentageScore: HTMLParagraphElement;
  reviewButton: HTMLButtonElement;
  newQuizButton: HTMLButtonElement;
  quizLoading: HTMLDivElement;
  quizError: HTMLDivElement;
  reviewSection: HTMLDivElement;
  reviewFinalScore: HTMLParagraphElement;
  backToQuizButton: HTMLButtonElement;
  reviewQuestions: HTMLDivElement;
  newQuizFromReviewButton: HTMLButtonElement;
}

export class QuizGameManager {
  private elements: QuizGameElements;
  private quizState!: QuizState;
  private questions: TriviaQuestion[] = [];
  private shuffledOptions: string[][] = [];

  constructor() {
    this.elements = this.getDOMElements();
    this.initializeQuiz();
  }

  private getDOMElements(): QuizGameElements {
    return {
      quizContainer: document.querySelector(
        "#quiz-container > div:nth-child(1)"
      ) as HTMLDivElement,
      questionCard: document.querySelector(
        "#quiz-container > div:nth-child(2)"
      ) as HTMLDivElement,
      navigationDiv: document.querySelector(
        "#quiz-container > div:nth-child(3)"
      ) as HTMLDivElement,
      questionCounter: document.getElementById(
        "question-counter"
      ) as HTMLHeadingElement,
      categoryDisplay: document.getElementById(
        "category-display"
      ) as HTMLParagraphElement,
      scoreDisplay: document.getElementById(
        "score-display"
      ) as HTMLParagraphElement,
      progressBar: document.getElementById("progress-bar") as HTMLDivElement,
      difficultyBadge: document.getElementById(
        "difficulty-badge"
      ) as HTMLDivElement,
      questionText: document.getElementById(
        "question-text"
      ) as HTMLHeadingElement,
      answerOptions: document.getElementById(
        "answer-options"
      ) as HTMLDivElement,
      feedbackSection: document.getElementById(
        "feedback-section"
      ) as HTMLDivElement,
      feedbackIcon: document.getElementById("feedback-icon") as HTMLDivElement,
      feedbackTitle: document.getElementById(
        "feedback-title"
      ) as HTMLParagraphElement,
      feedbackMessage: document.getElementById(
        "feedback-message"
      ) as HTMLParagraphElement,
      prevButton: document.getElementById("prev-button") as HTMLButtonElement,
      nextButton: document.getElementById("next-button") as HTMLButtonElement,
      resultsModal: document.getElementById("results-modal") as HTMLDivElement,
      finalScore: document.getElementById(
        "final-score"
      ) as HTMLParagraphElement,
      percentageScore: document.getElementById(
        "percentage-score"
      ) as HTMLParagraphElement,
      reviewButton: document.getElementById(
        "review-button"
      ) as HTMLButtonElement,
      newQuizButton: document.getElementById(
        "new-quiz-button"
      ) as HTMLButtonElement,
      quizLoading: document.getElementById("quiz-loading") as HTMLDivElement,
      quizError: document.getElementById("quiz-error") as HTMLDivElement,
      reviewSection: document.getElementById(
        "review-section"
      ) as HTMLDivElement,
      reviewFinalScore: document.getElementById(
        "review-final-score"
      ) as HTMLParagraphElement,
      backToQuizButton: document.getElementById(
        "back-to-quiz-button"
      ) as HTMLButtonElement,
      reviewQuestions: document.getElementById(
        "review-questions"
      ) as HTMLDivElement,
      newQuizFromReviewButton: document.getElementById(
        "new-quiz-from-review-button"
      ) as HTMLButtonElement,
    };
  }

  private initializeQuiz(): void {
    try {
      const questionsData = sessionStorage.getItem(
        STORAGE_KEYS.TRIVIA_QUESTIONS
      );

      if (!questionsData) {
        this.showError();
        return;
      }

      this.questions = JSON.parse(questionsData);

      if (this.questions.length === 0) {
        this.showError();
        return;
      }

      this.quizState = {
        questions: this.questions,
        currentQuestionIndex: 0,
        score: 0,
        userAnswers: new Array(this.questions.length).fill(""),
        isComplete: false,
        showFeedback: false,
      };

      this.shuffledOptions = this.questions.map((question) => {
        if (question.type === "boolean") {
          return ["True", "False"];
        } else {
          return shuffleArray([
            question.correct_answer,
            ...question.incorrect_answers,
          ]);
        }
      });

      this.hideLoading();
      this.displayCurrentQuestion();
      this.setupEventListeners();
    } catch (error) {
      console.error("Error initializing quiz:", error);
      this.showError();
    }
  }

  private setupEventListeners(): void {
    this.elements.prevButton.addEventListener("click", () =>
      this.goToPreviousQuestion()
    );
    this.elements.nextButton.addEventListener("click", () =>
      this.goToNextQuestion()
    );
    this.elements.reviewButton.addEventListener("click", () =>
      this.showReview()
    );
    this.elements.newQuizButton.addEventListener(
      "click",
      () => (window.location.href = import.meta.env.BASE_URL)
    );
    this.elements.backToQuizButton.addEventListener("click", () =>
      this.hideReview()
    );
    this.elements.newQuizFromReviewButton.addEventListener(
      "click",
      () => (window.location.href = import.meta.env.BASE_URL)
    );
  }

  public displayCurrentQuestion(): void {
    const question = this.questions[this.quizState.currentQuestionIndex];
    const questionNumber = this.quizState.currentQuestionIndex + 1;
    const totalQuestions = this.questions.length;

    this.elements.questionCounter.textContent = formatQuestionNumber(
      this.quizState.currentQuestionIndex,
      totalQuestions
    );
    this.elements.categoryDisplay.textContent = question.category;
    this.elements.scoreDisplay.textContent = `${this.quizState.score}/${this.quizState.currentQuestionIndex}`;

    const progressPercentage = (questionNumber / totalQuestions) * 100;
    this.elements.progressBar.style.width = `${progressPercentage}%`;

    this.elements.difficultyBadge.textContent =
      question.difficulty.charAt(0).toUpperCase() +
      question.difficulty.slice(1);
    this.elements.difficultyBadge.className = `inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${this.getDifficultyColor(
      question.difficulty
    )}`;

    this.elements.questionText.textContent = question.question;

    this.createAnswerOptions(question);

    this.elements.prevButton.disabled =
      this.quizState.currentQuestionIndex === 0;
    this.updateNextButton();

    if (this.quizState.userAnswers[this.quizState.currentQuestionIndex]) {
      this.showFeedback(
        question,
        this.quizState.userAnswers[this.quizState.currentQuestionIndex]
      );
    } else {
      this.hideFeedback();
    }
  }

  private getButtonStyle(
    option: string,
    question: TriviaQuestion,
    hasAnswered: boolean
  ): string {
    const userAnswer =
      this.quizState.userAnswers[this.quizState.currentQuestionIndex];

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
  }

  private createAnswerOptions(question: TriviaQuestion): void {
    const options = this.shuffledOptions[this.quizState.currentQuestionIndex];

    this.elements.answerOptions.innerHTML = "";
    const hasAnswered =
      this.quizState.userAnswers[this.quizState.currentQuestionIndex] !== "";

    options.forEach((option) => {
      const button = document.createElement("button");
      button.className = this.getButtonStyle(option, question, hasAnswered);
      button.textContent = option;

      if (!hasAnswered) {
        button.addEventListener("click", () => this.selectAnswer(option));
      } else {
        button.disabled = true;
        button.style.cursor = "not-allowed";
      }

      this.elements.answerOptions.appendChild(button);
    });
  }

  private selectAnswer(selectedAnswer: string): void {
    const question = this.questions[this.quizState.currentQuestionIndex];

    if (
      this.quizState.userAnswers[this.quizState.currentQuestionIndex] !== ""
    ) {
      return;
    }

    this.quizState.userAnswers[this.quizState.currentQuestionIndex] =
      selectedAnswer;

    if (selectedAnswer === question.correct_answer) {
      this.quizState.score++;
    }

    this.showFeedback(question, selectedAnswer);
    this.createAnswerOptions(question);
    this.updateNextButton();
    this.elements.scoreDisplay.textContent = `${this.quizState.score}/${
      this.quizState.currentQuestionIndex + 1
    }`;
  }

  private showFeedback(question: TriviaQuestion, selectedAnswer: string): void {
    const isCorrect = selectedAnswer === question.correct_answer;

    this.elements.feedbackSection.classList.remove("hidden");

    if (isCorrect) {
      this.elements.feedbackSection.className =
        "mt-6 p-4 rounded-lg bg-green-50 border border-green-200";
      this.elements.feedbackIcon.innerHTML =
        '<svg class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
      this.elements.feedbackTitle.textContent = "Correct!";
      this.elements.feedbackTitle.className = "font-semibold text-green-800";
      this.elements.feedbackMessage.textContent = "Well done!";
      this.elements.feedbackMessage.className = "text-sm mt-1 text-green-700";
    } else {
      this.elements.feedbackSection.className =
        "mt-6 p-4 rounded-lg bg-red-50 border border-red-200";
      this.elements.feedbackIcon.innerHTML =
        '<svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
      this.elements.feedbackTitle.textContent = "Incorrect";
      this.elements.feedbackTitle.className = "font-semibold text-red-800";
      this.elements.feedbackMessage.textContent = `The correct answer is: ${question.correct_answer}`;
      this.elements.feedbackMessage.className = "text-sm mt-1 text-red-700";
    }

    this.quizState.showFeedback = true;
  }

  private hideFeedback(): void {
    this.elements.feedbackSection.classList.add("hidden");
    this.quizState.showFeedback = false;
  }

  private updateNextButton(): void {
    const hasAnswered =
      this.quizState.userAnswers[this.quizState.currentQuestionIndex] !== "";
    const isLastQuestion =
      this.quizState.currentQuestionIndex === this.questions.length - 1;

    this.elements.nextButton.disabled = !hasAnswered;
    this.elements.nextButton.textContent = isLastQuestion
      ? "Finish Quiz"
      : "Next Question";
  }

  private goToPreviousQuestion(): void {
    if (this.quizState.currentQuestionIndex > 0) {
      this.quizState.currentQuestionIndex--;
      this.displayCurrentQuestion();
    }
  }

  private goToNextQuestion(): void {
    if (this.quizState.currentQuestionIndex < this.questions.length - 1) {
      this.quizState.currentQuestionIndex++;
      this.displayCurrentQuestion();
    } else {
      this.finishQuiz();
    }
  }

  private finishQuiz(): void {
    this.quizState.isComplete = true;

    const percentage = calculatePercentage(
      this.quizState.score,
      this.questions.length
    );

    this.elements.finalScore.textContent = `You scored ${this.quizState.score} out of ${this.questions.length}`;
    this.elements.percentageScore.textContent = `${percentage}%`;

    const resultsIcon = document.getElementById(
      "results-icon"
    ) as HTMLDivElement;
    if (percentage >= SCORE_THRESHOLDS.EXCELLENT) {
      resultsIcon.textContent = RESULT_ICONS.EXCELLENT;
    } else if (percentage >= SCORE_THRESHOLDS.GOOD) {
      resultsIcon.textContent = RESULT_ICONS.GOOD;
    } else {
      resultsIcon.textContent = RESULT_ICONS.NEEDS_IMPROVEMENT;
    }

    this.elements.resultsModal.style.display = "flex";
    this.elements.resultsModal.classList.remove("hidden");
  }

  private showReview(): void {
    this.elements.resultsModal.style.display = "none";
    this.elements.resultsModal.classList.add("hidden");

    this.elements.quizContainer.classList.add("hidden");
    this.elements.reviewSection.classList.remove("hidden");

    this.elements.reviewFinalScore.textContent = `${this.quizState.score}/${this.questions.length}`;

    this.displayAllQuestions();
  }

  private hideReview(): void {
    this.elements.reviewSection.classList.add("hidden");
    this.elements.quizContainer.classList.remove("hidden");

    this.elements.resultsModal.style.display = "flex";
    this.elements.resultsModal.classList.remove("hidden");
  }

  private displayAllQuestions(): void {
    this.elements.reviewQuestions.innerHTML = "";

    this.questions.forEach((question, index) => {
      const questionDiv = document.createElement("div");
      questionDiv.className = "bg-white rounded-lg shadow-lg p-6";

      const userAnswer = this.quizState.userAnswers[index];
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
    this.elements.quizLoading.classList.add("hidden");
    this.elements.quizContainer.classList.remove("hidden");
    this.elements.questionCard.classList.remove("hidden");
    this.elements.navigationDiv.classList.remove("hidden");
  }

  private showError(): void {
    this.elements.quizLoading.classList.add("hidden");
    this.elements.quizError.classList.remove("hidden");
    this.elements.quizContainer.classList.add("hidden");
  }
}
