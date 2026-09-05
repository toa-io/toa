import type { Connector } from '../connector.js'

/** Which of the group this replica is, and how many of them there are. */
export interface Assignment {
  i: number
  n: number
}

/**
 * What one group of replicas decides together, in one place. The decisions here are the ones
 * processes cannot arrange by talking to each other: they need a single arbiter and a step
 * indivisible from its point of view.
 */
export interface Atom extends Connector {
  /**
   * An exclusive claim on slots of `0..total`: while this replica holds one, no other
   * replica of the group does. Answered from memory, so it costs nothing to ask.
   *
   * `null` while this replica owns nothing — after a restart, during a rollout, or while
   * coordination is unreachable. Whoever asks must be able to stand down: acting on a claim
   * that cannot be supported is a different guarantee, not a degraded one.
   */
  slots (total: number): number[] | null

  /**
   * Calls `listener` with the assignment this replica holds, and again whenever it changes —
   * one arrived, was lost, or the group resized. Answers with what removes the listener
   * again.
   *
   * A change and not a heartbeat: a group that stays as it is never calls back. It is called
   * once as it is added, with the claim as it stands.
   */
  onassigned (listener: (assignment: Assignment | null) => void): () => void

  /**
   * Debt the group has run up under each key, in milliseconds. Every call adds its own deltas
   * and reads back where the group stands, so a replica reports what it alone has spent and
   * still decides on what all of them have.
   *
   * Rejects where there is nothing to arbitrate through.
   */
  meter (keys: string[], deltas: number[]): Promise<number[]>

  /**
   * Runs `routine` holding `keys`, and while it holds them no other replica of the group
   * does. Waits for as long as it takes to acquire them.
   *
   * The lease is extended for as long as the routine runs. An extension that fails aborts the
   * signal the routine is given, which is the only way it learns it no longer holds what it
   * is working under.
   *
   * Rejects where there is nothing to arbitrate through.
   */
  lock<T> (keys: string | string[],
    routine: (signal: AbortSignal, context: unknown) => Promise<T>): Promise<T>
}

export interface Factory {
  /** @param group what the replicas deciding together have in common */
  atom (group: string, options?: { interval?: number }): Atom
}
