import { console } from 'openspan'
import { Connector, Gate } from '@toa.io/core'
import { PREDEFINED } from '@toa.io/definitions'

import { resolve } from './extensions/resolve.js'
import { host } from './host.js'

/**
 * A process, as a connector.
 *
 * What it holds is in two parts. Its *residents* are what the extensions keep in every process
 * whatever it runs — the readiness probe, the halt listener — and they connect before anything
 * else and go last. Everything else is what the command built.
 *
 * A halt disconnects neither: it takes down what the `Gate`s in the tree hold, and builds it
 * again when the interval is up. So what survives one is this object, the residents, and
 * whatever an extension put above a gate of its own.
 */
export class Workload extends Connector {
  /** @type {(workload: Workload) => Promise<import('@toa.io/core').Connector>} */
  #build

  /** Every gate in this process, in the order they were made. */
  #gates = []

  /** @type {import('@toa.io/core/types').extensions.Resident[]} */
  #residents = []

  /** @type {NodeJS.Timeout | null} */
  #timer = null

  #halting = false

  /**
   * @param {(workload: Workload) => Promise<import('@toa.io/core').Connector>} build
   *   what the command runs; called once, and given this so it can gate what it builds
   */
  constructor(build) {
    super()

    this.#build = build
  }

  /**
   * A part of this tree a halt takes down and builds again. Handed to extensions as
   * `Host.gate`, and used by `boot.composition` for the composition itself.
   *
   * @param {() => Promise<import('@toa.io/core').Connector>} build
   * @returns {import('@toa.io/core').Gate}
   */
  gate(build) {
    const gate = new Gate(build)

    this.#gates.push(gate)

    return gate
  }

  /**
   * Whether what a halt takes down is up. False from the moment a halt begins until the
   * rebuild has landed, so whoever is watching one is watching the thing itself rather than
   * a clock they set beside it.
   */
  running() {
    return !this.#halting && this.#gates.every((gate) => gate.holding())
  }

  /**
   * Stops this process for `seconds`, then builds it again.
   *
   * Returns before anything closes, on the next tick rather than in the caller's own.
   *
   * Whoever asks for this is a consumer callback more often than not, and `comq`'s `close`
   * waits for the outstanding message to be processed and acknowledged before it closes the
   * connection — so a teardown awaited inside that callback would be waiting on the callback
   * that is waiting on it. Letting the caller return first is the whole of what that needs;
   * the draining is already comq's, and the rest is each connector's own `close`.
   *
   * @param {number} seconds
   */
  halt(seconds) {
    if (this.#halting || !this.connected) return

    this.#halting = true

    setImmediate(() => void this.#cycle(seconds))
  }

  async open() {
    /*
     * Connected here rather than declared as dependencies, because what they are is read from
     * the extensions and a connector's dependencies are walked before `open` runs. The probe
     * goes up before the build so that it answers while the build is still happening.
     */
    this.#residents = await residents(this)

    for (const resident of this.#residents) {
      this.depends(resident)

      await resident.connect()
    }

    const root = await this.#build(this)

    this.depends(root)

    await root.connect()

    for (const resident of this.#residents) await resident.complete?.()
  }

  async close() {
    if (this.#timer !== null) {
      clearTimeout(this.#timer)
      this.#timer = null
    }
  }

  /**
   * @param {number} seconds
   */
  async #cycle(seconds) {
    /*
     * The window is measured from here, and not from where the teardown ends.
     *
     * A teardown takes as long as what it drains, and what it drains can be a call to a
     * component that has already halted — which under load is not a possibility but a
     * certainty, because there is always one in flight. That call is answered when its
     * callee is back, so a process that started counting afterwards would halt for a full
     * window beginning where everyone else's ended. Counting from the signal instead means
     * every process comes back at one instant however long its own teardown took, and one
     * whose teardown outran the window comes back at once, with nothing left to wait.
     */
    const resumesAt = Date.now() + seconds * 1000

    console.warn('Halting', { seconds })

    for (const resident of this.#residents) resident.halted?.(seconds)

    await this.#down(seconds)

    const remaining = resumesAt - Date.now()

    if (remaining <= 0) {
      // said out loud: for as long as it took, this process was neither halted nor working
      console.warn('Halted late, the teardown outran the window', {
        seconds,
        over: Math.round(-remaining / 1000)
      })

      return await this.#resume()
    }

    console.warn('Halted', { seconds })

    this.#timer = setTimeout(() => void this.#resume(), remaining)
    this.#timer.unref()
  }

  /**
   * In reverse: a gate an extension made is below the one that holds the composition.
   *
   * @param {number} [seconds] how long they stay down, where they are coming back
   */
  async #down(seconds) {
    for (const gate of [...this.#gates].reverse()) await gate.down(seconds)
  }

  /**
   * Building again is building, and nothing about it is special: the same function of the same
   * arguments, against the same infrastructure, as at boot. So it is tried once and not
   * retried, and a failure ends the process the way a boot failure ends it. Anything else
   * would be a second, weaker path to being up — one that could paper over a rebuild that does
   * not work, which is precisely what there is to find out.
   */
  async #resume() {
    this.#timer = null

    try {
      for (const gate of this.#gates) await gate.up()
    } catch (error) {
      console.error('Resume failed', { message: error?.message })

      await this.disconnect().catch((error) => {
        console.error('Shutdown after a failed resume failed', { message: error?.message })
      })

      process.exit(1)
    }

    this.#halting = false

    for (const resident of this.#residents) resident.resumed?.()

    console.info('Resumed')
  }
}

/**
 * What the extensions this process has loaded keep in it.
 *
 * The predefined ones are loaded here rather than left to whichever component happens to
 * reference them: two of them contribute to the process itself, and a process that runs no
 * component of its own must have them all the same.
 *
 * @param {Workload} workload
 * @returns {Promise<import('@toa.io/core/types').extensions.Resident[]>}
 */
async function residents(workload) {
  const { instances } = await import('./extensions/instances.js')

  await Promise.all(Object.keys(PREDEFINED).map(async (name) => await resolve(name)))

  const residents = []

  for (const factory of Object.values(instances)) {
    if (factory.resident === undefined) continue

    const resident = await factory.resident(host(workload))

    if (resident !== null && resident !== undefined) residents.push(resident)
  }

  return residents
}

