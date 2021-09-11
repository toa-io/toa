'use strict'

const { Composition } = require('@kookaburra/runtime')

const boot = require('./index')

async function composition (components) {
  const runtimes = await Promise.all(components.map(boot.runtime))
  const expositions = (await Promise.all(runtimes.map(boot.exposition))).flat()
  const bindings = runtimes.map((runtime) => boot.bindings.produce(runtime)).flat()
  const composition = new Composition()

  composition.depends(expositions)
  composition.depends(bindings)

  await remotes()

  return composition
}

const remotes = async () => {
  return Promise.all(boot.promise.resolve(async (name, resolve) => {
    const remote = await boot.remote(name)

    resolve(remote)

    return remote
  }))
}

exports.composition = composition
