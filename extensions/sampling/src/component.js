'use strict'

const { Connector } = require('@toa.io/core')
const { newid } = require('@toa.io/generic')

const { context } = require('./sample')
const { validate } = require('./validate')
const verify = require('./.component')

/**
 * @implements {toa.sampling.Component}
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

  /**
   * @hot
   */
  async invoke (endpoint, request) {
    if ('sample' in request) return this.#apply(endpoint, request)
    else return this.#component.invoke(endpoint, request)
  }

  /**
   * @param {string} endpoint
   * @param {toa.sampling.Request} request
   * @returns {Promise<toa.core.Reply>}
   */
  async #apply (endpoint, request) {
    const { sample, ...rest } = request

    validate(sample, 'request')

    if ('request' in sample) verify.request(sample.request, request)
    if (sample.terminate === true) return {}

    // make sure current state will be requested from the storage
    if (sample.storage?.current !== undefined && rest.query === undefined) rest.query = { id: newid() }

    /** @type {toa.core.Reply} */
    const reply = await context.apply(sample, () => this.#component.invoke(endpoint, rest))

    if (reply.exception) throw reply.exception
    if ('reply' in sample) verify.reply(sample.reply, reply)
    if ('events' in sample) verify.events(sample.events)

    return reply
  }
}

exports.Component = Component
