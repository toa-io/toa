export function promex<T = undefined> (): Promex<T>

interface Promex<T> extends Promise<T> {
  resolve (value: T): void

  reject (reason: any): void

  callback (error?: any, result?: T): void
}
