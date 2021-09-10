'use strict'

const { Composition } = require('@kookaburra/runtime')

const boot = require('./index')

async function composition (components) {
  const runtimes = await Promise.all(components.map(boot.runtime))
  const expositions = await Promise.all(runtimes.map(boot.exposition))

  await resolve(runtimes)

  const bindings = runtimes.map((runtime) => boot.bindings.produce(runtime)).flat()

  const composition = new Composition()

  composition.depends(expositions)
  composition.depends(bindings)

  return composition
}

const resolve = async (runtimes) => {
  return Promise.all(boot.promise.resolve(async (name, resolve) => {
    const runtime = runtimes.find((runtime) => runtime.locator.name === name)

    if (runtime) {
      resolve(runtime)
      return
    }

    const remote = await boot.remote(name)

    resolve(remote)

    return remote
  }))
}

exports.composition = composition
