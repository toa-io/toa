import { environment } from '@toa.io/generic'

export const ID = 'introspection'
export const NAMESPACE = 'introspection'

export const ENV = 'TOA_INTROSPECTION'

export const NODES = 'nodes'
export const EDGES = 'edges'

/** Where the UI is mounted; `/introspection/*` belongs to the components' own API. */
export const UI_PATH = '/.introspection'
export const UI_PORT = 8002

/**
 * The port the UI is served on. `UI_PORT` is what a deployment publishes and what the chart
 * renders; the variable is for a machine that runs more than one Toa process — a Toa checkout
 * beside an application, or two applications — where one of them has to give it up.
 */
export const UI_PORT_ENV = 'TOA_INTROSPECTION_UI_PORT'
export function uiPort(): number {
  const value = environment.get(UI_PORT_ENV)

  return value === undefined ? UI_PORT : Number(value)
}

export const DEFAULT_INTERVAL = 300
export const DEFAULT_THRESHOLD = 1024

/** How often a component re-announces its description, so that removed components fade out. */
export const ANNOUNCE_INTERVAL = 1_800_000

/**
 * `source` arrives over the wire, so the number of distinct edges a process
 * can hold must be bounded regardless of what peers send.
 */
export const MAX_EDGES = 4096

/** The signals component, and the event a process halts on. */
export const SIGNALS = 'signals'
export const SIGNAL = `${NAMESPACE}.${SIGNALS}.created`

/**
 * How long a halt may be asked to stay down for, seconds, where the deployment says nothing.
 *
 * The floor is what a teardown costs — a gateway drains for ten seconds and the broker shuts
 * down over about five — so below it a halt is mostly the halting. The ceiling is because a
 * halted deployment looks well to everything watching it, so one that overran would be an
 * outage with nothing reporting one. A deployment that knows better says so in its annotation.
 */
export const DURATION: Bounds = [30, 3600]

/**
 * How long the deployment may be given to go quiet before the map is read, seconds, where the
 * deployment says nothing.
 *
 * It is what a drain costs and nothing else: nothing is being added to the queues, so what is
 * in them is the backlog of the moment the signal landed. A deployment given less than it
 * needs is not stopped — it is found busy and the halt is called off.
 */
export const QUIESCENCE: Bounds = [30, 1800]

/** What a halt may ask for: `[min, max]`, seconds. */
export type Bounds = [number, number]

/**
 * How long a process that has found the deployment busy waits before it leaves the halt.
 *
 * Someone is always last to catch on. A process about to give up may be a beat behind one that
 * has just seen stillness and called the stop, and if it left on its own timing the deployment
 * would end half down. So it waits this out first, listening, and leaves only if no stop
 * arrived.
 */
export const GRACE: Bounds = [2, 120]
export const DEFAULT_GRACE = 10

/**
 * What a call observed just before the quiesce costs to become a row anyone can read: the
 * flush that carries it, the queue it is published to, and the merge that writes it.
 */
export const HALT_GAP = 3

/** How often a quiesced process flushes what it observed. See `Reporter`. */
export const QUIESCE_INTERVAL = 1

/** What a check of the map may take before the process treats it as unanswered. */
export const CHECK_TIMEOUT = 5000
