import { i18nService } from "../i18n/i18nService";

/**
 * Предупреждение перед показом рекламы (требование Yandex Games).
 *
 * Перед fullscreen-рекламой игрок обязан увидеть обратный отсчёт
 * «Реклама через 3… 2… 1…», чтобы реклама не прерывала действие внезапно.
 *
 * Оверлей построен на DOM, а не внутри Phaser-сцены, потому что:
 *  - отсчёт должен переживать смену и перезапуск сцен (SpinScene вызывает
 *    scene.restart() после каждого спина, Phaser-объекты при этом уничтожаются);
 *  - реклама при переходе между сценами запрашивается из create() ещё до того,
 *    как UI сцены построен;
 *  - DOM-оверлей поверх канваса сам перехватывает ввод, включая клики по кнопкам.
 */

let activeOverlay: HTMLDivElement | null = null;

function removeOverlay(): void {
  activeOverlay?.remove();
  activeOverlay = null;
}

function createOverlay(): HTMLDivElement {
  // Страховка от двух отсчётов одновременно: старый оверлей всегда убираем.
  removeOverlay();

  const root = document.createElement("div");
  root.className = "ad-warning-overlay";
  root.setAttribute("role", "alert");
  root.setAttribute("aria-live", "assertive");

  const label = document.createElement("div");
  label.className = "ad-warning-overlay__text";
  root.appendChild(label);

  document.body.appendChild(root);
  activeOverlay = root;

  return label;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Показать обратный отсчёт и дождаться его завершения.
 * @param seconds Длительность отсчёта в секундах
 */
export async function showAdCountdown(seconds = 3): Promise<void> {
  const label = createOverlay();
  const t = i18nService.getTranslations();

  try {
    for (let left = seconds; left > 0; left--) {
      label.textContent = `${t.adCountdownText} ${left} ${t.adCountdownSeconds}`;
      await delay(1000);
    }
    // Короткий кадр «Реклама» / «Ad» — переход к самому объявлению не выглядит резким.
    label.textContent = i18nService.isRussian() ? "Реклама" : "Ad";
    await delay(400);
  } finally {
    // finally, чтобы оверлей не остался висеть, если отсчёт прервали.
    removeOverlay();
  }
}

/**
 * Принудительно убрать оверлей (например, при ошибке до показа рекламы).
 */
export function hideAdCountdown(): void {
  removeOverlay();
}
