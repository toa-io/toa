'use strict'

const { Connector } = require('@toa.io/core')
const { underlay } = require('@toa.io/generic')

const shortcuts = require('./shortcuts')

class Context extends Connector {
  env
  name
  aspects
  operation

  #context
  #source

  constructor (context, operation) {
    super()

    this.operation = operation
    this.env = context.env
    this.name = context.name
    this.#context = context
    this.#source = source(context.locator, operation)

    this.depends(context)
  }

  async open () {
    this.aspects = this.#aspects(this.#context.aspects)
  }

  local = underlay(async ([endpoint], [request]) => {
    return this.#context.apply(endpoint, this.#attribute(request))
  })

  remote = underlay(async (segments, [request]) => {
    if (segments.length === 2) segments.unshift('default') // default namespace

    const [namespace, name, endpoint] = segments

    return this.#context.call(namespace, name, endpoint, this.#attribute(request))
  })

  /**
   * Stamps the origin of the call, unless the caller has set one explicitly.
   */
  #attribute (request) {
    if (this.#source === undefined) return request

    request ??= {}
    request.source ??= this.#source

    return request
  }

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

/**
 * Events, guards and rc phases get a Context without an operation,
 * thus their calls are not attributed.
 */
function source (locator, operation) {
  if (locator === undefined || operation === undefined) return undefined

  return { namespace: locator.namespace, component: locator.name, operation }
}

exports.Context = Context
