import { STORAGE_KEYS } from "../types";

export function redirectToHome(): void {
  sessionStorage.removeItem(STORAGE_KEYS.TRIVIA_QUESTIONS);
  sessionStorage.removeItem(STORAGE_KEYS.QUIZ_CONFIG);
  sessionStorage.removeItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);
  window.location.href = import.meta.env.BASE_URL;
}
