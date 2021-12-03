'use strict'

const { Composition } = require('@toa.io/core')

const boot = require('./index')

async function composition (paths, options) {
  normalize(options)

  const manifests = await Promise.all(paths.map((path) => boot.manifest(path, options)))
  const extensions = await Promise.all(manifests.map(boot.extensions))
  const expositions = await Promise.all(manifests.map(boot.discovery.expose))
  const runtimes = await Promise.all(manifests.map(boot.runtime))

  const producers = runtimes.map((runtime, index) =>
    boot.bindings.produce(runtime, manifests[index].operations))

  const receivers = await Promise.all(runtimes.map((runtime, index) =>
    boot.receivers(manifests[index], runtime)))

  return new Composition(expositions.flat(), producers.flat(), receivers.flat(), extensions.flat())
}

const normalize = (options) => {
  if (options === undefined) return
  if (options.bindings === null) options.bindings = []
}

exports.composition = composition
