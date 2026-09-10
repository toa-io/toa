import { AsyncLocalStorage } from 'node:async_hooks'
import { environment } from '@toa.io/generic'
import { LoopException } from './exceptions.js'

/**
 * The chain of hops the invocation running now passed through, and the rule that refuses one
 * that has come back to where it had been.
 *
 * Ambient, like the trace context and for the same reason: an algorithm's `context` is built
 * once per operation at boot and shared by every invocation of it, so nothing per-invocation
 * can be handed to it. It is not the trace context's own store, which `console.span` replaces
 * on every span and does not enter at all when the trace is unsampled — a chain that
 * disappears under sampling is a breaker that stops breaking in production.
 *
 * One writer, `Component.invoke`, where the hop is appended; two readers, `Call.invoke`, which
 * puts it on the request it is about to send, and `Outbox.row`, which writes it onto the row so
 * it outlives the operation that caused it.
 */

// as openspan holds its own: a process may carry two copies of this module, and a chain that
// is empty because the writer sat in the other one is a breaker that never fires
const KEY = Symbol.for('toa.core.trail')

type Store = typeof globalThis & { [KEY]?: AsyncLocalStorage<string[]> }

const storage = ((globalThis as Store)[KEY] ??= new AsyncLocalStorage<string[]>())

/**
 * How many times one hop may appear before the call is refused, and how long a chain may grow
 * at all. Repetition is the signal and names the cycle; depth is the backstop for a chain that
 * grows without repeating a hop, and it is what bounds the array on the wire.
 */
export interface Limits {
  repeats: number
  depth: number
}

/**
 * What the environment says, read where a component is built rather than once for the process,
 * as the outbox reads its own — so a composition booted after a variable was set sees it.
 *
 * `TOA_TRAIL_REPEATS=0` refuses nothing: the chain is still stamped, carried and bounded. It is
 * the off switch, and it exists because this refuses calls an application may be making today —
 * a handshake written as `a > b > a > b > a` is three occurrences of one hop. A breaker with no
 * way to open it is itself the outage.
 */
export function limits(): Limits {
  return {
    repeats: number('TOA_TRAIL_REPEATS', 3),
    depth: number('TOA_TRAIL_DEPTH', 32)
  }
}

/** The chain that led to the invocation running now, where there is one. */
export function current(): string[] | undefined {
  return storage.getStore()
}

/** Runs `task` as the hop the chain now ends with. */
export async function follow<T>(hops: string[], task: () => Promise<T>): Promise<T> {
  return storage.run(hops, task)
}

/**
 * The chain this hop makes, or a raise where it is one hop too many: a hop already taken
 * `repeats` times is a cycle, and a chain past `depth` is one nothing meant to make. Both are
 * permanent, so what hits one is set aside rather than tried again into the same loop.
 *
 * The chain is copied rather than appended to, which is what makes it a path down the call
 * tree rather than a log of everything that happened — an operation calling one endpoint fifty
 * times makes fifty chains of one hop, not one chain of fifty.
 */
export function extend(inbound: unknown, hop: string, limits: Limits): string[] {
  const hops = clip(received(inbound), limits.depth)
  const trail = [...hops, hop]

  if (limits.repeats === 0) return trail

  if (trail.length > limits.depth)
    throw new LoopException(`Call chain is ${trail.length} hops deep`, trail)

  let seen = 0

  for (const passed of hops) if (passed === hop) seen++

  if (seen + 1 >= limits.repeats)
    throw new LoopException(`'${hop}' is hop ${seen + 1} of this chain`, trail)

  return trail
}

/**
 * How an event is named in a chain. The sigil is what tells it from an operation: the two are
 * the same shape, a component may declare one of each under a single name, and `sync` is both
 * the event every component inherits and an ordinary name for an operation.
 *
 * What an operator rewires to break a cycle is the subscription rather than the operation, so a
 * chain that named only operations would not say how a component was re-entered.
 */
export function event(destination: string): string {
  return '~' + destination
}

/**
 * What came off the wire, as a chain and nothing else. Neither the request contract nor a
 * message validates this — a request is not validated at all once it is `authentic` — so a
 * malformed one would otherwise become a `TypeError` where a named exception was contracted
 * for. Bounding it is `extend`'s, one hop later, which is the only place the limits are known.
 */
export function received(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((hop) => typeof hop === 'string') : []
}

// with the hop being appended that is one past the cap, which is enough to be refused; the
// rest is a message buying memory, and where the rule is off it is what bounds the chain
function clip(hops: string[], depth: number): string[] {
  return hops.length > depth ? hops.slice(0, depth) : hops
}

function number(variable: string, fallback: number): number {
  const declared = Number(environment.get(variable))

  return Number.isNaN(declared) || declared < 0 ? fallback : declared
}
