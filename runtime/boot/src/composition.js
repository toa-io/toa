'use strict'

const { Composition } = require('@kookaburra/core')

const boot = require('./index')

// this is a mess. again
async function composition (paths, options) {
  normalize(options)

  const runtimes = await Promise.all(paths.map((path) => boot.runtime(path, options?.bindings)))
  const bindings = runtimes.map((runtime) => boot.bindings.produce(runtime, options?.bindings))

  // start exposition strictly before promised remotes resolution
  // this solves circular dependencies among compositions
  const expositions = (await Promise.all(runtimes.map((runtime) =>
    boot.exposition(runtime, options?.bindings))))

  // resolve promised remotes strictly after bindings has been created
  // binding.loop is required for circular dependencies resolution within the composition
  await boot.promise.resolve('remote', async (name, resolve) =>
    resolve(await boot.remote(name, options?.bindings)))

  await boot.promise.resolve('producers', (fqn, resolve) => {
    const i = runtimes.findIndex((runtime) => runtime.locator.fqn === fqn)

    resolve(bindings[i])
  })

  const composition = new Composition()

  composition.depends(expositions.flat())
  composition.depends(bindings.flat())

  return composition
}

const normalize = (options) => {
  if (!options) return

  if (options.bindings === null) options.bindings = []
}

exports.composition = composition
