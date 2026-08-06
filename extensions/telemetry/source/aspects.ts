export interface Logs {
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
  debug: (message: string, ...args: any[]) => void
}

export interface Span {
  <T>(name: string, task: () => T | Promise<T>): Promise<T>
  <T>(name: string, attributes: object, task: () => T | Promise<T>): Promise<T>
}
