'use strict'

const { Composition } = require('@toa.io/core')

const boot = require('./index')

async function composition (paths, options) {
  options = Object.assign({}, options)

  const manifests = await Promise.all(paths.map((path) => boot.manifest(path, options)))
  const tenants = await Promise.all(manifests.map(boot.extensions.tenants))
  const expositions = await Promise.all(manifests.map(boot.discovery.expose))
  const components = await Promise.all(manifests.map(boot.component))

  const producers = components.map((component, index) =>
    boot.bindings.produce(component, manifests[index].operations))

  const receivers = await Promise.all(components.map((component, index) =>
    boot.receivers(manifests[index], component)))

  return new Composition(expositions.flat(), producers.flat(), receivers.flat(), tenants.flat())
}

exports.composition = composition
