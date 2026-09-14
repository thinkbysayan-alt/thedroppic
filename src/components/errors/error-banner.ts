import type { AppError } from '../../types';

/** Renders a friendly error banner. Never surfaces raw WASM/browser error text. */
export function renderErrorBanner(error: AppError, onDismiss?: () => void): HTMLElement {
  const banner = document.createElement('div');
  banner.className = 'error-banner';
  banner.setAttribute('role', 'alert');

  banner.innerHTML = `
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.63-1.516 2.63H3.72c-1.347 0-2.189-1.463-1.516-2.63L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
    </svg>
    <div class="error-banner__body">
      <p class="error-banner__title">Something went wrong</p>
      <p class="error-banner__message"></p>
    </div>
  `;

  banner.querySelector('.error-banner__message')!.textContent = error.message;

  if (onDismiss) {
    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'btn btn-secondary';
    dismissBtn.textContent = 'Try again';
    dismissBtn.addEventListener('click', onDismiss);
    banner.querySelector('.error-banner__body')!.appendChild(dismissBtn);
  }

  return banner;
}
