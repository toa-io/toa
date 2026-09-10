import { setTimeout as delay } from 'node:timers/promises'
import { console } from 'openspan'
import { environment } from '@toa.io/generic'
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
   * Returns at once and does the work on a timer: whoever calls this is a consumer callback
   * more often than not, and the teardown seals the communication that callback is being
   * awaited by. The lead is what lets a reply be written and a message acked first.
   *
   * @param {number} seconds
   */
  halt(seconds) {
    if (this.#halting || !this.connected) return

    this.#halting = true

    this.#timer = setTimeout(() => void this.#cycle(seconds), LEAD)
    this.#timer.unref()
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
    this.#timer = null

    for (const resident of this.#residents) resident.halted?.(seconds)

    await this.#down(seconds)

    console.warn('Halted', { seconds })

    const window = seconds * 1000

    // spread, so that a fleet does not arrive at the database and the broker in one moment
    this.#timer = setTimeout(
      () => void this.#resume(),
      window + Math.random() * Math.min(window / 10, JITTER)
    )

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

  async #resume() {
    this.#timer = null

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        for (const gate of this.#gates) await gate.up()

        this.#halting = false

        for (const resident of this.#residents) resident.resumed?.()

        console.info('Resumed')

        return
      } catch (error) {
        console.error('Resume failed', { attempt, error })

        // what came up before the failure goes down again, so the next attempt is a build
        await this.#down()

        if (attempt < ATTEMPTS)
          await delay(BACKOFF * 2 ** (attempt - 1), undefined, { ref: false })
      }
    }

    /*
     * A process that stays up rebuilding for ever is what a halt is otherwise designed to
     * avoid: it answers its probe, holds nothing, does nothing, and nobody is told. It leaves
     * instead, the way a process that cannot boot leaves — the probe going down with it.
     */
    console.error('Resume failed, giving up', { attempts: ATTEMPTS })

    await this.disconnect().catch((error) => {
      console.error('Shutdown after a failed resume failed', { error })
    })

    process.exit(1)
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

/**
 * What a halt waits before it begins.
 *
 * Whoever asks for one is a consumer callback, and the teardown seals the communication that
 * callback is being awaited by — so the reply is written and the message acked first. A suite
 * that would otherwise wait this out states its own.
 */
const LEAD = number('TOA_HALT_LEAD', 2000)

/** The most a rebuild is spread over. */
const JITTER = 5000

const ATTEMPTS = 3
const BACKOFF = number('TOA_HALT_BACKOFF', 2000)

/**
 * @param {string} variable
 * @param {number} fallback
 * @returns {number}
 */
function number(variable, fallback) {
  const value = Number(environment.get(variable))

  return Number.isNaN(value) || value <= 0 ? fallback : value
}
