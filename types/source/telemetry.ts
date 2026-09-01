export interface Logs {
  trace: Method
  debug: Method
  info: Method
  warn: Method
  error: Method
}

type Method = (message: string, attributes?: unknown) => void
