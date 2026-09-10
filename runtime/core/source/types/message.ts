export interface Message<T = any> {
  payload: T
  /** W3C traceparent */
  telemetry?: string
  /**
   * The hops that led to the state change this is about, so a receiver of it continues the
   * chain rather than starting one. See `core/source/trail.ts`.
   */
  trail?: string[]
}
