export interface Message<T = any> {
  payload: T
  /**
   * What this message is, so that a receiver's state change happens once however many times it
   * arrives. Derived from the outbox row it was published from, which is committed once, so the
   * immediate path, the pump and a redelivery all carry the one identity.
   */
  id?: string
  /** W3C traceparent */
  telemetry?: string
  /**
   * The hops that led to the state change this is about, so a receiver of it continues the
   * chain rather than starting one. See `core/source/trail.ts`.
   */
  trail?: string[]
}
