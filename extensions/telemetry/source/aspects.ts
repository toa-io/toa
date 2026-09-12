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

/** The instruments this component declared in its manifest, by the name each was declared under. */
export type Metrics = Record<string, Counter | Gauge | Histogram>

export interface Counter {
  add: (value?: number, labels?: Record<string, unknown>) => void
}

export interface Gauge {
  set: (value: number, labels?: Record<string, unknown>) => void
  add: (delta: number, labels?: Record<string, unknown>) => void
}

export interface Histogram {
  record: (value: number, labels?: Record<string, unknown>) => void
}
