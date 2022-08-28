'use strict'

const { Composition } = require('@toa.io/core')

const boot = require('./index')

async function composition (paths, options) {
  normalize(options)

  /** @type {toa.norm.Component[]} */
  const manifests = await Promise.all(paths.map((path) => boot.manifest(path, options)))

  // boot.extensions.preload(options.extensions)

  /** @type {toa.core.Connector[]} */
  const tenants = await Promise.all(manifests.map(boot.extensions.tenants))

  const expositions = await Promise.all(manifests.map(boot.discovery.expose))

  /** @type {toa.core.Component[]} */
  const components = await Promise.all(manifests.map(boot.component))

  const producers = components.map((runtime, index) =>
    boot.bindings.produce(runtime, manifests[index].operations))

  const receivers = await Promise.all(components.map((runtime, index) =>
    boot.receivers(manifests[index], runtime)))

  return new Composition(expositions.flat(), producers.flat(), receivers.flat(), tenants.flat())
}

const normalize = (options) => {
  if (options === undefined) return
  if (options.bindings === null) options.bindings = []
}

// const DEFAULTS = {
//   extensions: ['@toa.io/extensions.sampling']
// }

exports.composition = composition
