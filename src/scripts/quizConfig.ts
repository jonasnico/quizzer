import { TriviaAPI } from "../utils/api";
import type { QuizConfig } from "../types";
import { STORAGE_KEYS } from "../types";

interface QuizConfigElements {
  form: HTMLFormElement;
  amountSlider: HTMLInputElement;
  amountDisplay: HTMLSpanElement;
  amountText: HTMLSpanElement;
  loadingState: HTMLDivElement;
  errorState: HTMLDivElement;
  errorMessage: HTMLParagraphElement;
  retryButton: HTMLButtonElement;
}

export class QuizConfigManager {
  private elements: QuizConfigElements;

  constructor() {
    this.elements = this.getDOMElements();
    this.setupEventListeners();
  }

  private getDOMElements(): QuizConfigElements {
    return {
      form: document.getElementById("quiz-config-form") as HTMLFormElement,
      amountSlider: document.getElementById("amount") as HTMLInputElement,
      amountDisplay: document.getElementById(
        "amount-display"
      ) as HTMLSpanElement,
      amountText: document.getElementById("amount-text") as HTMLSpanElement,
      loadingState: document.getElementById("loading-state") as HTMLDivElement,
      errorState: document.getElementById("error-state") as HTMLDivElement,
      errorMessage: document.getElementById(
        "error-message"
      ) as HTMLParagraphElement,
      retryButton: document.getElementById("retry-button") as HTMLButtonElement,
    };
  }

  private setupEventListeners(): void {
    this.elements.amountSlider.addEventListener("input", () => {
      this.updateAmountDisplay();
    });

    this.elements.form.addEventListener("submit", async (e) => {
      await this.handleFormSubmit(e);
    });

    this.elements.retryButton.addEventListener("click", () => {
      this.hideError();
    });
  }

  private updateAmountDisplay(): void {
    const value = this.elements.amountSlider.value;
    this.elements.amountDisplay.textContent = value;
    this.elements.amountText.textContent = value;

    this.elements.amountDisplay.style.transform = "scale(1.1)";
    setTimeout(() => {
      this.elements.amountDisplay.style.transform = "scale(1)";
    }, 150);
  }

  private async handleFormSubmit(e: Event): Promise<void> {
    e.preventDefault();

    const formData = new FormData(this.elements.form);
    const config: QuizConfig = {
      amount: parseInt(formData.get("amount") as string),
      category: formData.get("category")
        ? parseInt(formData.get("category") as string)
        : undefined,
      difficulty:
        (formData.get("difficulty") as "easy" | "medium" | "hard") || undefined,
      type: (formData.get("type") as "multiple" | "boolean") || undefined,
    };

    await this.startQuiz(config);
  }

  private async startQuiz(config: QuizConfig): Promise<void> {
    try {
      this.showLoading();
      const questions = await TriviaAPI.fetchQuestions(config);

      sessionStorage.setItem(
        STORAGE_KEYS.TRIVIA_QUESTIONS,
        JSON.stringify(questions)
      );
      sessionStorage.setItem(STORAGE_KEYS.QUIZ_CONFIG, JSON.stringify(config));

      window.location.href = import.meta.env.BASE_URL + "/quiz";
    } catch (error) {
      console.error("Error starting quiz:", error);
      this.showError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  private showLoading(): void {
    this.elements.form.classList.add("hidden");
    this.elements.errorState.classList.add("hidden");
    this.elements.loadingState.classList.remove("hidden");
  }

  private showError(message: string): void {
    this.elements.loadingState.classList.add("hidden");
    this.elements.errorState.classList.remove("hidden");
    this.elements.errorMessage.textContent = message;
  }

  private hideError(): void {
    this.elements.errorState.classList.add("hidden");
    this.elements.form.classList.remove("hidden");
  }
}
