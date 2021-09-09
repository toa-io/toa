'use strict'

const { Connector } = require('@kookaburra/runtime')

const boot = require('./index')

async function composition (components, options) {
  const composition = new Connector()

  const runtimes = await Promise.all(components.map(boot.runtime))
  const expositions = await Promise.all(runtimes.map(boot.exposition))

  resolve(runtimes)

  const bindings = runtimes
    .map((runtime) => (options?.bindings || DEFAULTS.bindings).map((binding) => boot.producer(runtime, binding)))
    .flat()

  composition.depends(expositions)
  composition.depends(bindings)

  return composition
}

const resolve = (runtimes) => {
  boot.promise.resolve(async (name, resolve) => {
    const runtime = runtimes.find((runtime) => runtime.locator.name === name)

    if (runtime) {
      resolve(runtime)
      return
    }

    const remote = await boot.remote(name)

    resolve(remote)

    return remote
  })
}

const DEFAULTS = {
  bindings: ['@kookaburra/bindings.http', '@kookaburra/bindings.amqp']
}

exports.composition = composition
