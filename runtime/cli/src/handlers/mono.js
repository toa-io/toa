import { pathToFileURL } from 'node:url'
import { console as output } from 'openspan'
import { Connector } from '@toa.io/core'
import * as boot from '@toa.io/boot'
import { component } from '@toa.io/norm'
import { version } from '@toa.io/runtime'

import { graceful } from './lib/graceful.js'
import { components as find } from '../util/find.js'

/**
 * @param {Record<string, string | boolean | string[]>} argv
 * @return {Promise<void>}
 */
async function mono (argv) {
  console.log('Runtime', version)

  const paths = find(argv.paths)
  const services = await createServices(paths)
  const composition = await boot.composition(paths, argv)
  const connector = new Connector()

  connector.depends([composition, ...services])

  const start = async () => {
    graceful(connector)

    await connector.connect()
  }

  if (process.env.TOA_BOOT_TRACE === '1') await output.span('toa mono', start)
  else await start()

  if (argv.kill === true) await connector.disconnect()
}

/**
 * The services of the extensions the components reference. A service hosts components of
 * its own, and those reference extensions too — the identity components inside the gateway
 * wait for the values service — so what a running service hosts is looked into as well.
 *
 * @param {string[]} paths
 * @return {Promise<toa.core.Connector[]>}
 */
async function createServices (paths) {
  const references = new Set()
  const services = []
  const pending = [...paths]

  while (pending.length > 0) {
    const manifest = await component(pending.shift())

    for (const reference of Object.keys(manifest.extensions ?? {})) {
      if (references.has(reference)) continue

      references.add(reference)

      const { Factory, components } = await import(pathToFileURL(reference).href)

      if (typeof Factory?.prototype.service !== 'function') continue

      const service = await new Factory(boot).service()

      // an extension that is off in this environment hosts nothing here either
      if (service === null) continue

      services.push(service)

      if (components !== undefined) pending.push(...components().paths)
    }
  }

  return services
}

export { mono }
