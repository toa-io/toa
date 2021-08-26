'use strict'

const server = (runtimes, bindings) => {
  return bindings.map((binding) => {
    const { Factory } = require(resolve(binding))
    const factory = new Factory()

    return factory.server(runtimes)
  })
}

const resolve = (name) => `@kookaburra/bindings.${name}`

exports.server = server
