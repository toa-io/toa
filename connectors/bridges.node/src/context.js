'use strict'

const { Connector } = require('@toa.io/core')
const { underlay } = require('@toa.io/gears')

class Context extends Connector {
  #context

  constructor (context) {
    super()

    this.#context = context

    this.depends(context)
  }

  local = underlay(async ([endpoint], [request]) => this.#context.apply(endpoint, request))
  remote = underlay(async ([domain, name, endpoint], [request]) => this.#context.call(domain, name, endpoint, request))
}

exports.Context = Context
