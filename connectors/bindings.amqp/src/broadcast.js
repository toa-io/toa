'use strict'

const { id, Connector } = require('@kookaburra/core')

class Broadcast extends Connector {
  #id
  #channel
  #prefix

  constructor (channel, prefix) {
    super()

    this.#id = id()

    this.#channel = channel
    this.#prefix = prefix + '.'

    this.depends(channel)
  }

  async emit (label, payload) {
    await this.#channel.publish(this.#prefix + label, payload)
  }

  async receive (label, callback) {
    await this.#channel.subscribe(this.#prefix + label, this.#id, callback)
  }
}

exports.Broadcast = Broadcast
