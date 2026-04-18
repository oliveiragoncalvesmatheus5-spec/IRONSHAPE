import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const withTimeout = <T>(
  promiseFn: () => Promise<T> | PromiseLike<T>, 
  timeoutMs: number = 15000, 
  retries: number = 0
): Promise<T> => {
  const execute = async (attempt: number): Promise<T> => {
    try {
      return await Promise.race([
        Promise.resolve(promiseFn()),
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na requisição')), timeoutMs)
        )
      ]);
    } catch (error: any) {
      if (error.message === 'Timeout na requisição' && attempt < retries) {
        console.warn(`Request timed out, retrying... (${attempt + 1}/${retries})`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        return execute(attempt + 1);
      }
      throw error;
    }
  };

  return execute(0);
};
