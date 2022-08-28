'use strict'

const { Composition } = require('@toa.io/core')

const boot = require('./index')

/**
 * @param {string[]} paths
 * @param {toa.boot.composition.Options} [options]
 * @returns {Promise<Composition>}
 */
const composition = async (paths, options = {}) => {
  options = Object.assign(DEFAULTS, options)

  /** @type {toa.norm.Component[]} */
  const manifests = await Promise.all(paths.map((path) => boot.manifest(path, options)))

  boot.extensions.load(manifests, options.extensions)

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

const DEFAULTS = {
  extensions: ['@toa.io/extensions.sampling']
}

exports.composition = composition
