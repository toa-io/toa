'use strict'

const { Package } = require('@kookaburra/package')
const { Connector } = require('@kookaburra/runtime')
const { Server: HTTPServer } = require('@kookaburra/http')
const { runtime: createRuntime } = require('./runtime')

async function composition (components) {
  const composition = new Connector()
  const http = new HTTPServer()

  for (let component of components) {
    if (!(component instanceof Package)) { component = await Package.load(component) }

    const runtime = await createRuntime(component)

    http.bind(runtime, component.operations)
    http.depends(runtime)
  }

  composition.depends(http)

  return composition
}

exports.composition = composition
