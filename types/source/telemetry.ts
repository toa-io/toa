export interface Logs {
  info: Method
  warn: Method
  error: Method
  debug: Method
}

type Method = (message: string, attributes?: unknown) => void
