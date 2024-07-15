'use strict'

const { Connector } = require('@toa.io/core')
const { underlay } = require('@toa.io/generic')

const shortcuts = require('./shortcuts')

class Context extends Connector {
  operation
  aspects

  #context

  constructor (context, operation) {
    super()

    this.operation = operation
    this.#context = context

    this.depends(context)
  }

  async open () {
    this.aspects = this.#aspects(this.#context.aspects)
  }

  local = underlay(async ([endpoint], [request]) => {
    return this.#context.apply(endpoint, request)
  })

  remote = underlay(async (segments, [request]) => {
    if (segments.length === 2) segments.unshift('default') // default namespace

    const [namespace, name, endpoint] = segments

    return this.#context.call(namespace, name, endpoint, request)
  })

  #aspects (aspects) {
    const map = {}

    for (const aspect of aspects) {
      if (map[aspect.name] !== undefined) throw new Error(`Aspect conflict on '${aspect.name}'`)

      map[aspect.name] = aspect.invoke.bind(aspect)

      if (aspect.name in shortcuts)
        shortcuts[aspect.name](this, aspect)
    }

    return map
  }
}

exports.Context = Context
