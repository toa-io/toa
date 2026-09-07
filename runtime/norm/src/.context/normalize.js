import * as definitions from '@toa.io/definitions'

/**
 * @param {toa.norm.context.Declaration | Object} context
 */
export const normalize = (context) => {
  if (context.runtime === undefined) context.runtime = { version: definitions.version }
  if (typeof context.runtime === 'string') context.runtime = { version: context.runtime }

  if (context.runtime.version === undefined || context.runtime.version === '.') {
    context.runtime.version = definitions.version
  }

  if (typeof context.registry === 'string') context.registry = { base: context.registry }

  // what an image is built for, where the Context does not say
  if (context.registry !== undefined) context.registry.platforms ??= PLATFORMS
}

const PLATFORMS = ['linux/amd64', 'linux/arm/v7', 'linux/arm64']
