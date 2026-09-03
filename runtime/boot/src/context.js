import { Context, Locator } from '@toa.io/core'

import * as boot from './index.js'

export const context = async (manifest) => {
  const local = await boot.remote(manifest.locator, undefined, manifest)
  const aspects = boot.extensions.aspects(manifest)

  // a system aspect: it is there in every component, declared by none of them
  aspects.push(boot.atom(manifest.locator.id))

  const lookup = async (namespace, name) => {
    const locator = new Locator(name, namespace)
    const remote = await boot.remote(locator)

    await remote.connect()

    return remote
  }

  const context = new Context(local, lookup, aspects)

  return boot.extensions.context(context)
}
