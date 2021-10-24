'use strict'

const { underlay } = require('@toa.io/gears')
const { Connector } = require('@toa.io/core')

class Context extends Connector {
  local
  remote

  #context

  constructor (context) {
    super()

    this.#context = context

    this.local = underlay(async (endpoint, request) => this.#context.apply(endpoint, request))

    this.remote = underlay(async (domain, name, endpoint, request) =>
      this.#context.call(domain, name, endpoint, request))

    this.depends(context)
  }
}

exports.Context = Context
