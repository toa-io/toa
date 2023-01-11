'use strict'

const { Connector } = require('@toa.io/core')
const { newid } = require('@toa.io/libraries/generic')

const { context } = require('./sample')
const { validate } = require('./.component/validate')
const verify = require('./.component')

/**
 * @implements {toa.core.Component}
 */
class Component extends Connector {
  /** @type {toa.core.Locator} */
  locator

  /** @type {toa.core.Component} */
  #component

  /**
   * @param {toa.core.Component} component
   */
  constructor (component) {
    super()

    this.locator = component.locator
    this.#component = component

    this.depends(component)
  }

  /** @hot */
  async invoke (endpoint, request) {
    this.#resolve(request)

    if (request.sample === undefined) return this.#component.invoke(endpoint, request)
    else return this.#apply(endpoint, request)
  }

  /**
   * @param {string} endpoint
   * @param {toa.core.Request} request
   * @returns {Promise<toa.core.Reply>}
   */
  async #apply (endpoint, request) {
    const { sample, ...rest } = request

    validate(sample)

    // make sure current state will be requested from the storage
    if (sample.storage?.current !== undefined && rest.query === undefined) rest.query = { id: newid() }

    /** @type {toa.core.Reply} */
    const reply = await context.apply(sample, () => this.#component.invoke(endpoint, rest))

    verify.reply(sample.reply, reply)
    verify.events(sample.events)

    return reply
  }

  /**
   * Context may contain a message sample if an operation is invoked by the receiver
   *
   * @param {toa.core.Request} request
   *
   * @hot
   */
  #resolve (request) {
    /** @type {toa.sampling.Message} */
    // const sample = context.get()

    // if (sample?.request === undefined) return

    // verify.request(sample.request, request)
  }
}

exports.Component = Component
