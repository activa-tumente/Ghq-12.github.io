/**
 * Utility function for debouncing function calls
 * Prevents excessive function calls during rapid events
 */
export class Debouncer {
  private timer: NodeJS.Timeout | null = null;
  private readonly defaultDelay: number;

  constructor(defaultDelay: number = 1000) {
    this.defaultDelay = defaultDelay;
  }

  /**
   * Debounce a function call
   * @param callback Function to debounce
   * @param delay Delay in milliseconds (optional, uses default if not provided)
   */
  debounce(callback: () => void, delay?: number): void {
    this.cancel();
    this.timer = setTimeout(() => {
      callback();
      this.timer = null;
    }, delay ?? this.defaultDelay);
  }

  /**
   * Cancel any pending debounced call
   */
  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Check if there's a pending debounced call
   */
  isPending(): boolean {
    return this.timer !== null;
  }

  /**
   * Immediately execute any pending call and cancel the timer
   */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * Simple debounce function for one-time use
 * @param callback Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      callback(...args);
      timer = null;
    }, delay);
  };
}