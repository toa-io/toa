export function promex<T> (): Promex<T>

interface Promex<T = any, E = any> extends Promise<T> {
  resolve (value: T): void

  reject (reason: E): void

  callback (error?: E, result?: T): void
}
