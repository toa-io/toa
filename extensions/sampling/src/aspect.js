'use strict'

const { match } = require('@toa.io/generic')
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
    const sample = /** @type {toa.sampling.request.Sample} */ context.get()
    const calls = sample?.extensions?.[this.name]
    const autonomous = sample?.autonomous ?? false

    if (autonomous && (calls === undefined || calls.length === 0)) {
      throw new Error(`Autonomous sample does not contain '${this.name}' aspect call`)
    }

    if (calls === undefined) return this.#aspect.invoke(...args)
    else return this.#replay(calls, args, autonomous)
  }

  /**
   * @param {toa.sampling.request.extensions.Call[]} calls
   * @param {any[]} args
   * @param {boolean} autonomous
   */
  #replay (calls, args, autonomous) {
    const permanent = calls[0].permanent === true
    const sample = permanent ? calls[0] : calls.shift()

    if (autonomous && !('result' in sample)) throw new Error(`Autonomous sample does not contain result for '${this.name}' aspect call`)

    if (sample.arguments !== undefined) {
      const matches = match(args, sample.arguments)

      if (!matches) {
        throw new ReplayException(`Context extension '${this.name}' call arguments mismatch`, args, sample.arguments)
      }
    }

    if ('result' in sample) return sample.result
    else return this.#aspect.invoke(...args)
  }
}

exports.Aspect = Aspect
