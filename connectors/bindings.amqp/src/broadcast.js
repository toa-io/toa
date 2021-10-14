'use strict'

const { id, Connector } = require('@kookaburra/core')

class Broadcast extends Connector {
  #group
  #channel
  #prefix

  constructor (channel, prefix, group) {
    super()

    this.#group = group === undefined ? id() : group

    this.#channel = channel
    this.#prefix = prefix + '.'

    this.depends(channel)
  }

  async send (label, payload) {
    await this.#channel.publish(this.#prefix + label, payload)
  }

  async receive (label, callback) {
    await this.#channel.subscribe(this.#prefix + label, this.#group, callback)
  }
}

exports.Broadcast = Broadcast
