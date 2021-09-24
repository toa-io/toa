'use strict'

const { Composition } = require('@kookaburra/core')

const boot = require('./index')

async function composition (paths, options) {
  normalize(options)

  const manifests = await Promise.all(paths.map((path) => boot.manifest(path, options)))
  const expositions = await Promise.all(manifests.map(boot.exposition))
  const runtimes = await Promise.all(manifests.map(boot.runtime))
  const producers = runtimes.map((runtime) => boot.bindings.produce(runtime))

  return new Composition(expositions.flat(), producers.flat())
}

const normalize = (options) => {
  if (options === undefined) return

  if (options.bindings === null) options.bindings = []
}

exports.composition = composition
