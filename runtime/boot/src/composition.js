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
        const serving = [...local, ...other]

        producers.push(...serving)

        /*
         * A receiver turns an event into a call to an operation of its own component, and
         * that call is served by these — the loop producer first, the broker's if it has
         * already gone. They are siblings under the composition otherwise, so a receiver
         * still draining a delivery would be left calling something already torn down.
         */
        // one at a time: `depends` given an array links the group it makes rather than its
        // members, and it is the members whose teardown has to wait for this one
        for (const receiver of receivers[i])
          for (const producer of serving) receiver.depends(producer)

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

      /*
       * A lookup that is never answered holds a connection open, and whoever
       * awaits it has nothing to disconnect — the remote it would belong to does
       * not exist yet. The composition owns the process's discovery instead, so
       * an unanswered lookup cannot outlive it.
       */
      composition.depends(await boot.discovery.discovery())

      return boot.extensions.manage(composition)
    } catch (exception) {
      await Promise.all(expositions.flat().map((connector) => connector.disconnect(true)))
      throw exception
    }
  })
}

exports.composition = composition
