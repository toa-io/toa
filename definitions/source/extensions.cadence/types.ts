/** What one component declares under `cadence:`, by the operation each entry calls. */
export type Declaration = Record<string, Entry[]>

/** One way an operation is called: on a cadence, or at the moments of a calendar. */
export type Entry = Pulse | Schedule

/**
 * What a manifest may state for an operation: one entry or a list of them, each a whole entry,
 * one with what it leaves to the default left out, or its cycle or its expression alone.
 */
export type Declared = Record<string, Stated | Stated[]>

export type Stated =
  | number
  | string
  | (Partial<Pulse> & { cycle: number })
  | (Partial<Schedule> & { schedule: string })

export interface Pulse {
  /** seconds one whole cycle takes */
  cycle: number

  /** intervals the cycle is split into; the gap between calls is `cycle / intervals` */
  intervals: number

  /**
   * Whose work this is: `group` is the component's, and one replica makes each call; `replica`
   * is every replica's own, for what lives inside a process.
   */
  scope: Scope

  /** the rank of the region that makes the calls; every region makes them where absent */
  region?: number
}

export interface Schedule {
  /** a cron expression of five fields, or of six where the first is seconds */
  schedule: string

  /** the time zone the expression is read in */
  zone: string

  /**
   * Seconds a call may be late and still be made. Absent, it is made until the next one comes
   * due, so that at most one occurrence is ever owed.
   */
  overdue?: number

  /** the rank of the region that makes the calls; every region makes them where absent */
  region?: number
}

export type Scope = 'group' | 'replica'

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

  /**
   * Whether this call begins a chain of its own rather than continuing the one arming it.
   *
   * A delay is a hop like any other, so an operation that arms a call to its own endpoint is
   * going round in a circle and is refused on the third round. That is right where it has gone
   * round by mistake and wrong where the recurrence is meant, which only the caller knows.
   *
   * It does not make the call repeat: a delayed call is made once either way. What repeats is
   * the operation arming the next one as it runs, and this is what keeps that from counting.
   */
  unchained?: boolean
}

/** What an application states under `cadence:` in its context. */
export interface Annotation {
  /** seconds between passes over the calls waiting to be made */
  discreteness?: number

  /** the ranks of the regions whose delayed calls this deployment makes; its own by default */
  regions?: number[]
}
