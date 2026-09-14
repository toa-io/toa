/**
 * Whether this process is halting.
 *
 * A halt is the one teardown that is not a shutdown: the process stays, and what it held is
 * built again. Two things read this and act differently because of it — a connection gives up
 * the replies it is waiting for rather than holding the teardown open for a peer that is
 * halting too, and a rejection from a tree that has been taken down is reported rather than
 * fatal, because the process is in exactly the state the runtime put it in.
 *
 * Ambient, like the instance name and the invocation chain, and for the same reason: a process
 * may carry two copies of this module, and an answer from one of them answers for half a
 * process.
 */

const KEY = Symbol.for('toa.core.halting')

type Store = typeof globalThis & { [KEY]?: { underway: boolean } }

const store = ((globalThis as Store)[KEY] ??= { underway: false })

export function begin(): void {
  store.underway = true
}

export function end(): void {
  store.underway = false
}

export function underway(): boolean {
  return store.underway
}
