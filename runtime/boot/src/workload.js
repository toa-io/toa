import { Connector } from '@toa.io/core'
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

  /**
   * @param {(workload: Workload) => Promise<import('@toa.io/core').Connector>} build
   *   what the command runs, called once
   */
  constructor(build) {
    super()

    this.#build = build
  }

  async open() {
    /*
     * Connected here rather than declared as dependencies, because what they are is read from
     * the extensions and a connector's dependencies are walked before `open` runs. The probe
     * goes up before the build so that it answers while the build is still happening.
     */
    this.#residents = await residents()

    for (const resident of this.#residents) {
      this.depends(resident)

      await resident.connect()
    }

    const root = await this.#build(this)

    this.depends(root)

    await root.connect()

    for (const resident of this.#residents) await resident.complete?.()
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
async function residents() {
  const { instances } = await import('./extensions/instances.js')

  await Promise.all(Object.keys(PREDEFINED).map(async (name) => await resolve(name)))

  const residents = []

  for (const factory of Object.values(instances)) {
    if (factory.resident === undefined) continue

    const resident = await factory.resident(host())

    if (resident !== null && resident !== undefined) residents.push(resident)
  }

  return residents
}
