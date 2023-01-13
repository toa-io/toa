'use strict'

const { difference, match } = require('@toa.io/libraries/generic')
const { context } = require('./sample')
const { ReplayException } = require('./exceptions')

/**
 * @implements {toa.core.extensions.Aspect}
 */
class Aspect {
  name

  /** @type {toa.core.extensions.Aspect} */
  #aspect

  /**
   * @param {toa.core.extensions.Aspect} aspect
   */
  constructor (aspect) {
    this.name = aspect.name

    this.#aspect = aspect
  }

  invoke (...args) {
    const sample = /** @type {toa.sampling.Request} */ context.get()
    const calls = sample?.extensions?.[this.name]

    if (calls === undefined) return this.#aspect.invoke(...args)
    else return this.#replay(calls, args)
  }

  /**
   * @param {toa.sampling.request.extensions.Call[]} calls
   * @param {any[]} args
   */
  #replay (calls, args) {
    const permanent = calls[0].permanent === true
    const sample = permanent ? calls[0] : calls.shift()

    if (sample.arguments !== undefined) {
      const matches = match(args, sample.arguments)

      if (!matches) {
        const diff = difference(sample.arguments, args)

        console.error(diff)

        throw new ReplayException(`Context extension '${this.name}' call arguments mismatch`)
      }
    }

    if (sample.result !== undefined) return sample.result
    else return this.#aspect.invoke(...args)
  }
}

exports.Aspect = Aspect
