import { STORAGE_KEYS } from "../types";

export function redirectToHome(): void {
  sessionStorage.removeItem(STORAGE_KEYS.TRIVIA_QUESTIONS);
  sessionStorage.removeItem(STORAGE_KEYS.QUIZ_CONFIG);
  sessionStorage.removeItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);
  window.location.href = import.meta.env.BASE_URL;
}

export function toggleElementVisibility(
  element: HTMLElement,
  visible: boolean
): void {
  if (visible) {
    element.classList.remove("hidden");
  } else {
    element.classList.add("hidden");
  }
}

export function setElementText(element: HTMLElement, text: string): void {
  element.textContent = text;
}
