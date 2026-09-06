export interface Message<T = any> {
  payload: T
  /** W3C traceparent */
  telemetry?: string
}
