/**
 * The messages this process has taken and not yet finished with.
 *
 * A binding counts one in for as long as it holds a delivery, and that is exactly what its own
 * teardown waits for: a connection cannot close while a message it dispatched is still being
 * handled, and a handler waiting on a call of its own holds it there. So this answers, for the
 * process as a whole, whether a teardown has anything left to wait on.
 *
 * It is not `toa.call.inflight`, which counts the other side — callers waiting. That number is
 * non-zero for a call a gateway made, which blocks no teardown, and zero for a handler held open
 * by a database commit, which blocks one.
 *
 * Ambient, like the instance name and the invocation chain, and for the same reason: a process
 * may carry two copies of this module, and a count kept in one of them answers for half a
 * process.
 */

const KEY = Symbol.for('toa.core.deliveries')

type Store = typeof globalThis & { [KEY]?: { count: number; idle?: Array<() => void> } }

const store = ((globalThis as Store)[KEY] ??= { count: 0 })

// a copy of this module from before `settled` holds the store without it
store.idle ??= []

/** One more delivery is being handled. */
export function taken(): void {
  store.count++
}

/** One fewer: the handler has returned, however it returned. */
export function done(): void {
  store.count--

  if (store.count === 0) for (const resolve of store.idle!.splice(0)) resolve()
}

/** How many this process is handling now. */
export function inflight(): number {
  return store.count
}

/**
 * Resolves once this process is handling nothing.
 *
 * What a consumer waits for before it stops consuming, rather than for its own deliveries alone:
 * a delivery still running may be waiting on a call to a component this same process serves, and
 * a component that stopped taking calls first would leave it waiting for good — and the teardown
 * waiting on it.
 */
export async function settled(): Promise<void> {
  if (store.count === 0) return

  await new Promise<void>((resolve) => store.idle!.push(resolve))
}
