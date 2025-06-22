import {
  shuffleArray,
  formatQuestionNumber,
  calculatePercentage,
} from "../utils/api";
import type { TriviaQuestion, QuizState } from "../types";
import { STORAGE_KEYS, SCORE_THRESHOLDS } from "../types";
import { redirectToHome, toggleElementVisibility } from "../utils/dom";
import { BUTTON_STYLES, RESULT_ICONS, TOAST_STYLES } from "../utils/styles";

interface QuizGameElements {
  questionCounter: HTMLHeadingElement;
  categoryDisplay: HTMLParagraphElement;
  scoreDisplay: HTMLParagraphElement;
  progressBar: HTMLDivElement;
  difficultyBadge: HTMLDivElement;
  questionText: HTMLHeadingElement;
  answerOptions: HTMLDivElement;
  toastContainer: HTMLDivElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  resultsCard: HTMLDivElement;
  resultsCardIcon: HTMLDivElement;
  resultsCardScore: HTMLParagraphElement;
  resultsCardPercentage: HTMLParagraphElement;
  resultsReviewButton: HTMLButtonElement;
  resultsNewQuizButton: HTMLButtonElement;
  errorNewQuizButton: HTMLButtonElement;
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
      toastContainer: document.getElementById(
        "toast-container"
      ) as HTMLDivElement,
      prevButton: document.getElementById("prev-button") as HTMLButtonElement,
      nextButton: document.getElementById("next-button") as HTMLButtonElement,
      resultsCard: document.getElementById("results-card") as HTMLDivElement,
      resultsCardIcon: document.getElementById(
        "results-card-icon"
      ) as HTMLDivElement,
      resultsCardScore: document.getElementById(
        "results-card-score"
      ) as HTMLParagraphElement,
      resultsCardPercentage: document.getElementById(
        "results-card-percentage"
      ) as HTMLParagraphElement,
      resultsReviewButton: document.getElementById(
        "results-review-button"
      ) as HTMLButtonElement,
      resultsNewQuizButton: document.getElementById(
        "results-new-quiz-button"
      ) as HTMLButtonElement,
      errorNewQuizButton: document.getElementById(
        "error-new-quiz-button"
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

      const reviewData = sessionStorage.getItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);

      if (reviewData) {
        const parsedReviewData = JSON.parse(reviewData);
        this.quizState = parsedReviewData.quizState;
        this.shuffledOptions = parsedReviewData.shuffledOptions;

        this.hideLoading();
        this.showCompletedQuizResults();
        this.setupEventListeners();
        return;
      }

      this.quizState = {
        questions: this.questions,
        currentQuestionIndex: 0,
        score: 0,
        userAnswers: new Array(this.questions.length).fill(""),
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
    this.elements.resultsReviewButton.addEventListener("click", () =>
      this.goToReviewPage()
    );
    this.elements.resultsNewQuizButton.addEventListener(
      "click",
      redirectToHome
    );
    this.elements.errorNewQuizButton.addEventListener(
      "click",
      redirectToHome
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

    this.showToast(question, selectedAnswer);
    this.createAnswerOptions(question);
    this.updateNextButton();
    this.elements.scoreDisplay.textContent = `${this.quizState.score}/${
      this.quizState.currentQuestionIndex + 1
    }`;
  }

  private showToast(question: TriviaQuestion, selectedAnswer: string): void {
    const isCorrect = selectedAnswer === question.correct_answer;

    const toast = document.createElement("div");
    toast.className = `${TOAST_STYLES.BASE} ${
      isCorrect ? TOAST_STYLES.SUCCESS : TOAST_STYLES.ERROR
    } translate-x-full opacity-0`;

    const icon = isCorrect ? "✓" : "✗";
    const title = isCorrect ? "Correct!" : "Incorrect";
    const message = isCorrect
      ? "Well done!"
      : `The correct answer is: ${question.correct_answer}`;

    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 mr-3">
          <span class="text-lg font-bold">${icon}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold">${title}</p>
          <p class="text-sm mt-1">${message}</p>
        </div>
        <button class="ml-2 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    this.elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("translate-x-full", "opacity-0");
      toast.classList.add("translate-x-0", "opacity-100");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("translate-x-0", "opacity-100");
      toast.classList.add("translate-x-full", "opacity-0");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, 3000);
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
    const percentage = calculatePercentage(
      this.quizState.score,
      this.questions.length
    );

    sessionStorage.setItem(
      STORAGE_KEYS.QUIZ_REVIEW_DATA,
      JSON.stringify({
        questions: this.questions,
        quizState: this.quizState,
        shuffledOptions: this.shuffledOptions,
      })
    );

    this.showResults(percentage);
  }

  private goToReviewPage(): void {
    window.location.href = import.meta.env.BASE_URL + "/review";
  }

  private showCompletedQuizResults(): void {
    const percentage = calculatePercentage(
      this.quizState.score,
      this.questions.length
    );

    this.showResults(percentage);
  }

  private showResults(percentage: number): void {
    this.elements.resultsCardScore.textContent = `You scored ${this.quizState.score} out of ${this.questions.length}`;
    this.elements.resultsCardPercentage.textContent = `${percentage}%`;

    if (percentage >= SCORE_THRESHOLDS.EXCELLENT) {
      this.elements.resultsCardIcon.textContent = RESULT_ICONS.EXCELLENT;
    } else if (percentage >= SCORE_THRESHOLDS.GOOD) {
      this.elements.resultsCardIcon.textContent = RESULT_ICONS.GOOD;
    } else {
      this.elements.resultsCardIcon.textContent =
        RESULT_ICONS.NEEDS_IMPROVEMENT;
    }

    const questionCard = document.querySelector(
      "#quiz-container > div:nth-child(3)"
    ) as HTMLDivElement;
    const navigationDiv = document.querySelector(
      "#quiz-container > div:nth-child(5)"
    ) as HTMLDivElement;

    toggleElementVisibility(questionCard, false);
    toggleElementVisibility(navigationDiv, false);
    toggleElementVisibility(this.elements.resultsCard, true);
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
    const quizLoading = document.getElementById(
      "quiz-loading"
    ) as HTMLDivElement;
    const quizContainer = document.querySelector(
      "#quiz-container > div:nth-child(1)"
    ) as HTMLDivElement;
    const questionCard = document.querySelector(
      "#quiz-container > div:nth-child(2)"
    ) as HTMLDivElement;
    const navigationDiv = document.querySelector(
      "#quiz-container > div:nth-child(3)"
    ) as HTMLDivElement;

    toggleElementVisibility(quizLoading, false);
    toggleElementVisibility(quizContainer, true);
    toggleElementVisibility(questionCard, true);
    toggleElementVisibility(navigationDiv, true);
  }

  private showError(): void {
    const quizLoading = document.getElementById(
      "quiz-loading"
    ) as HTMLDivElement;
    const quizError = document.getElementById("quiz-error") as HTMLDivElement;
    const quizContainer = document.querySelector(
      "#quiz-container > div:nth-child(1)"
    ) as HTMLDivElement;

    toggleElementVisibility(quizLoading, false);
    toggleElementVisibility(quizError, true);
    toggleElementVisibility(quizContainer, false);
  }
}
