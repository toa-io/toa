'use strict'

const { console } = require('openspan')
const { Composition } = require('@toa.io/core')
const { version } = require('@toa.io/runtime/package.json')

const boot = require('./index')
const { span } = require('./span')

async function composition (paths, options) {
  options = Object.assign({}, options)

  return span('boot composition', async () => {
    const manifests = await span('load manifests',
      async () => await Promise.all(paths.map((path) => boot.manifest(path, options))))

    console.info('Starting composition', {
      runtime: version,
      components: manifests.map((manifest) => manifest.locator.id)
    })

    const tenants = await span('create tenants',
      async () => await Promise.all(manifests.map(boot.extensions.tenants)))

    const expositions = await span('expose discovery',
      async () => await Promise.all(manifests.map(boot.discovery.expose)))

    try {
      const components = await span('create components',
        async () => await Promise.all(manifests.map(boot.component)))

      const groups = components.map((component, index) =>
        boot.bindings.produce(component, manifests[index].operations))

      const receivers = await span('create receivers',
        async () => await Promise.all(components.map((component, index) =>
          boot.receivers(manifests[index], component))))

      const producers = []
      const settles = []

      for (let i = 0; i < components.length; i++) {
        const { local, other } = groups[i]
        const settle = components[i].settle

        producers.push(...local, ...other)

        if (settle === undefined)
          continue

        if (local.length > 0)
          settle.depends(local)

        for (const producer of other)
          producer.depends(settle)

        for (const receiver of receivers[i])
          receiver.depends(settle)

        settles.push(settle)
      }

      const composition = new Composition(expositions.flat(), producers.concat(settles), receivers.flat(), tenants.flat())

      return boot.extensions.manage(composition)
    } catch (exception) {
      await Promise.all(expositions.flat().map((connector) => connector.disconnect(true)))
      throw exception
    }
  })
}

exports.composition = composition
