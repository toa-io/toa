export interface Message<T = any> {
  payload: T
  telemetry?: string // W3C traceparent
}
