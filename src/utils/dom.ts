export function redirectToHome(): void {
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

export function setElementClass(element: HTMLElement, className: string): void {
  element.className = className;
}
