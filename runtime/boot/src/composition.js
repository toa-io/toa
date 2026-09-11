import { console } from 'openspan'
import { Composition } from '@toa.io/core'
import { version } from '@toa.io/definitions'
import { environment } from '@toa.io/generic'

import * as boot from './index.js'
import { span } from './span.js'

export async function composition(paths, options) {
  // what a test set after this package loaded goes to the store now, before a module of a
  // component is imported: nothing of it is left in `process.env` for that module to read
  environment.absorb()

  options = Object.assign({}, options)

  return span('boot composition', async () => {
    const manifests = await span(
      'load manifests',
      async () => await Promise.all(paths.map((path) => boot.manifest(path, options)))
    )

    console.info('Starting composition', {
      runtime: version,
      components: manifests.map((manifest) => manifest.locator.id)
    })

    const tenants = await span(
      'create tenants',
      async () => await Promise.all(manifests.map(boot.extensions.tenants))
    )

    const expositions = await span(
      'expose discovery',
      async () => await Promise.all(manifests.map(boot.discovery.expose))
    )

    try {
      const components = await span(
        'create components',
        async () => await Promise.all(manifests.map(boot.component))
      )

      const groups = await Promise.all(
        components.map(
          async (component, index) =>
            await boot.bindings.produce(component, manifests[index].operations)
        )
      )

      const receivers = await span(
        'create receivers',
        async () =>
          await Promise.all(
            components.map((component, index) =>
              boot.receivers(manifests[index], component)
            )
          )
      )

      const producers = []
      const settles = []
      const readies = []

      for (let i = 0; i < components.length; i++) {
        const { local, other } = groups[i]
        const { settle, ready } = components[i]
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

        /*
         * The broker producers serve the stateful endpoints under the process's name, and the
         * name is held once they are open — before then a call to it is refused. `ready` is where
         * a component hands the name out, so it waits for every producer and receiver of its own.
         */
        if (ready !== undefined) {
          for (const producer of serving) ready.depends(producer)

          for (const receiver of receivers[i]) ready.depends(receiver)

          readies.push(ready)
        }

        if (settle === undefined) continue

        if (local.length > 0) settle.depends(local)

        for (const producer of other) producer.depends(settle)

        for (const receiver of receivers[i]) receiver.depends(settle)

        settles.push(settle)
      }

      const composition = new Composition(
        expositions.flat(),
        producers.concat(settles, readies),
        receivers.flat(),
        tenants.flat()
      )

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
