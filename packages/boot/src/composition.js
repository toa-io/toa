'use strict'

const { Package } = require('@kookaburra/package')
const { Connector } = require('@kookaburra/runtime')
const { http: createHTTP } = require('./http')
const { runtime: createRuntime } = require('./runtime')

async function composition (components, options) {
  const composition = new Connector()
  const http = createHTTP(options?.http)

  for (let component of components) {
    if (typeof component === 'string') { component = await Package.load(component) }

    const runtime = await createRuntime(component)

    http.bind(runtime, component.operations)
    http.depends(runtime)
  }

  composition.depends(http)

  return composition
}

exports.composition = composition
