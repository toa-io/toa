'use strict'

const { Composition } = require('@kookaburra/core')

const boot = require('./index')

async function composition (components, options) {
  const runtimes = await Promise.all(components.map(boot.runtime))
  const expositions = (await Promise.all(runtimes.map(boot.exposition))).flat()
  const bindings = runtimes.map((runtime) => boot.bindings.produce(runtime, options?.bindings)).flat()
  const composition = new Composition()

  await Promise.all(boot.promise.resolve(async (name, resolve) =>
    resolve(await boot.remote(name, options?.bindings))))

  composition.depends(expositions)
  composition.depends(bindings)

  return composition
}

exports.composition = composition
