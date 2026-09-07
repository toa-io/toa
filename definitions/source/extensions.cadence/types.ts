/** What one component declares under `cadence:`, by the operation each one calls. */
export type Declaration = Record<string, Pulse>

export interface Pulse {
  /** seconds one whole cycle takes */
  cycle: number

  /** intervals the cycle is split into; the gap between calls is `cycle / intervals` */
  intervals: number
}

/** `context.delay` — a call to be made later, answering the id that cancels it. */
export interface Delay {
  (endpoint: string, request: object | null, options: Options): Promise<string>

  /** Raises where the id was never issued. */
  cancel: (id: string) => Promise<void>
}

export interface Options {
  /** milliseconds from now */
  interval: number

  /**
   * Milliseconds the call may be late and still be made, or `null` for no bound at all.
   *
   * Stated rather than defaulted, because only the caller knows whether a late call is still
   * the right call: an unpaid order expires on time or not at all, and a report is wanted
   * whenever it can be had. Nothing else in the system can tell those apart.
   *
   * An upper bound on lateness, not a promise of timeliness. It is bounded below by how often
   * a dispatcher scans, so a bound shorter than that is one nothing can honour.
   */
  overdue: number | null
}

/** What an application states under `cadence:` in its context. */
export interface Annotation {
  /** seconds between passes over the calls waiting to be made */
  discreteness?: number
}
