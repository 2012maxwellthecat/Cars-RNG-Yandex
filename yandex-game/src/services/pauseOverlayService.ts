/**
 * Сервис для отображения визуального оверлея паузы
 */
class PauseOverlayService {
  private overlay: HTMLDivElement | null = null;

  /**
   * Показать оверлей паузы
   */
  show(): void {
    if (this.overlay) {
      this.overlay.style.display = "flex";
      return;
    }

    this.overlay = document.createElement("div");
    this.overlay.id = "pause-overlay";
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Arial Black', Arial, sans-serif;
    `;

    const pauseIcon = document.createElement("div");
    pauseIcon.innerHTML = "⏸️";
    pauseIcon.style.cssText = `
      font-size: 80px;
      margin-bottom: 20px;
      animation: pulse 2s ease-in-out infinite;
    `;

    const pauseText = document.createElement("div");
    pauseText.textContent = "PAUSED";
    pauseText.style.cssText = `
      font-size: 48px;
      font-weight: bold;
      color: #ffd700;
      text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
      letter-spacing: 8px;
    `;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.1); }
      }
    `;

    this.overlay.appendChild(pauseIcon);
    this.overlay.appendChild(pauseText);
    document.head.appendChild(style);
    document.body.appendChild(this.overlay);

    console.log("[PauseOverlay] Оверлей паузы показан");
  }

  /**
   * Скрыть оверлей паузы
   */
  hide(): void {
    if (this.overlay) {
      this.overlay.style.display = "none";
      console.log("[PauseOverlay] Оверлей паузы скрыт");
    }
  }

  /**
   * Удалить оверлей полностью
   */
  destroy(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      console.log("[PauseOverlay] Оверлей паузы удален");
    }
  }
}

export const pauseOverlayService = new PauseOverlayService();
