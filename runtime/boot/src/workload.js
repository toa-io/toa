import { console } from 'openspan'
import { Connector, Gate, deliveries, halting } from '@toa.io/core'
import { PREDEFINED } from '@toa.io/definitions'

import { resolve } from './extensions/resolve.js'
import { host } from './host.js'

/**
 * A process, as a connector.
 *
 * What it holds is in two parts. Its *residents* are what the extensions keep in every process
 * whatever it runs — the readiness probe is the one there is — and they connect before
 * everything else and go last. The rest is what the command built.
 *
 * Which is what a process had no name for before: `toa compose`, `toa serve` and `toa mono`
 * each assembled a root out of a bare `Connector` and their own arithmetic, and an extension
 * with something to put in a process had nowhere to put it.
 */
export class Workload extends Connector {
  /** @type {(workload: Workload) => Promise<import('@toa.io/core').Connector>} */
  #build

  /** @type {import('@toa.io/core/types').extensions.Resident[]} */
  #residents = []

  /** @type {import('@toa.io/core').Gate[]} */
  #gates = []

  /** @type {NodeJS.Timeout | null} */
  #timer = null

  #halting = false

  #quiesced = false

  /**
   * @param {(workload: Workload) => Promise<import('@toa.io/core').Connector>} build
   *   what the command runs, called once
   */
  constructor(build) {
    super()

    this.#build = build
  }

  /**
   * A part of this tree a halt takes down and builds again. Handed to extensions as
   * `Host.gate`, and used by the handlers for what the command runs.
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
   * Whether what a halt takes down is up. False from the moment a halt begins until the rebuild
   * has landed, so whoever watches one watches the thing itself rather than a clock beside it.
   */
  running() {
    return !this.#halting && this.#gates.every((gate) => gate.holding())
  }

  /**
   * Whether this process is quiet: it does nothing of its own accord, and holds everything it
   * had open. What a halt does before it decides whether to go down.
   */
  quiescent() {
    return this.#quiesced
  }

  /**
   * Stops what this process does of its own accord and holds open everything it has: the
   * gateway answers `503`, the clocks stop, and each component gets its `pause`. Nothing
   * closes, so nothing has to be built again to undo it.
   *
   * Awaited, unlike `stop`: whoever asks for this goes on to watch what the deployment does
   * next, and that is only worth watching once this process has gone quiet.
   */
  async quiesce() {
    if (this.#halting || this.#quiesced || !this.connected) return

    this.#quiesced = true

    await this.halt()
  }

  /** Undoes a quiesce. Nothing was taken down, so nothing is built again. */
  async cancel() {
    if (this.#halting || !this.#quiesced) return

    this.#quiesced = false

    await this.restore()
  }

  /**
   * Stops this process for `seconds`, then builds it again.
   *
   * Returns before anything closes, on the next tick rather than in the caller's own: whoever
   * asks for this is a consumer callback more often than not, and a connection waits for the
   * message being handled before it closes, so a teardown awaited inside that callback would be
   * waiting on the callback that is waiting on it.
   *
   * @param {number} seconds
   */
  stop(seconds) {
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
     * The window is measured from here rather than from where the teardown ends.
     *
     * A teardown takes as long as what it drains, so a process that started counting afterwards
     * would be down for a window beginning where everyone else's ended. Counting from the signal
     * means every process comes back at one instant however long its own teardown took, and one
     * whose teardown outran the window comes back at once with nothing left to wait for.
     */
    const resumesAt = Date.now() + seconds * 1000

    halting.begin()

    console.warn('Halting', { seconds })

    for (const resident of this.#residents) resident.halted?.(seconds)

    this.#quiesced = true

    /*
     * Quiet first, then down. A source stopped before the drain begins is work that never
     * starts, so what the teardown waits for is only what was already in hand — and a component
     * gets its `pause` while it is still whole, which is the one moment it can release what the
     * runtime cannot see.
     */
    await this.halt()

    /*
     * Whoever called this stop saw the deployment still, and this process was not: what it is
     * handling has written no edge yet. Nothing is abandoned — the teardown waits for every
     * one of these — but it is the one thing that makes a halt take longer than it says, so
     * it is said out loud.
     */
    const inflight = deliveries.inflight()

    if (inflight > 0) console.warn('Halting with deliveries in flight', { inflight })

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
   * In reverse: a gate an extension made is below the one that holds what the command runs.
   *
   * @param {number} [seconds] how long they stay down, where they are coming back
   */
  async #down(seconds) {
    for (const gate of [...this.#gates].reverse()) await gate.down(seconds)
  }

  /**
   * Building again is building, and nothing about it is special: the same function of the same
   * arguments, against the same infrastructure, as at boot. So it is tried once, and a failure
   * ends the process the way a boot failure ends it. Anything else would be a second, weaker
   * path to being up, one that could paper over a rebuild that does not work, which is precisely
   * what there is to find out.
   */
  async #resume() {
    this.#timer = null

    try {
      for (const gate of this.#gates) await gate.up()
    } catch (error) {
      console.error('Resume failed', { message: error?.message })

      await this.disconnect().catch((failure) => {
        console.error('Shutdown after a failed resume failed', { message: failure?.message })
      })

      process.exit(1)
    }

    await this.restore()

    this.#quiesced = false
    this.#halting = false

    halting.end()

    for (const resident of this.#residents) resident.resumed?.()

    console.info('Resumed')
  }
}

/**
 * What the extensions this process has loaded keep in it.
 *
 * The predefined ones are loaded here rather than left to whichever component happens to
 * reference them: what a resident answers for is the process, and a process that runs no
 * component of its own must have one all the same.
 *
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
