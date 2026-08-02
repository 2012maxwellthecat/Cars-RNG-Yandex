/**
 * Утилита для повторных попыток выполнения асинхронных операций
 * с таймаутом и экспоненциальной задержкой между попытками.
 *
 * Используется для SDK методов, которые могут зависать или падать
 * при проблемах с сетью.
 */

/**
 * Выполняет функцию с повторными попытками при ошибке
 *
 * @param fn - Асинхронная функция для выполнения
 * @param maxAttempts - Максимальное количество попыток (по умолчанию 3)
 * @param delayMs - Базовая задержка между попытками в мс (по умолчанию 1000)
 * @param timeoutMs - Таймаут для каждой попытки в мс (по умолчанию 10000)
 * @returns Результат функции или null при исчерпании всех попыток
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000,
  timeoutMs = 10000
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Выполняем функцию с таймаутом
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        ),
      ]);

      // Успех - возвращаем результат
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;

      console.warn(
        `[Retry] Попытка ${attempt}/${maxAttempts} не удалась:`,
        error instanceof Error ? error.message : error
      );

      // Если это последняя попытка, возвращаем null
      if (isLastAttempt) {
        console.error('[Retry] Все попытки исчерпаны, возвращаем null');
        return null;
      }

      // Экспоненциальная задержка: delayMs * attempt
      // 1-я попытка: 1000ms, 2-я: 2000ms, 3-я: 3000ms
      const delay = delayMs * attempt;
      console.log(`[Retry] Ожидание ${delay}ms перед следующей попыткой...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
}
