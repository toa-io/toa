import * as runtime from '@toa.io/runtime'

/**
 * @param {toa.norm.context.Declaration | Object} context
 */
const normalize = (context) => {
  if (context.runtime === undefined) context.runtime = { version: runtime.version }
  if (typeof context.runtime === 'string') context.runtime = { version: context.runtime }

  if (context.runtime.version === undefined || context.runtime.version === '.') {
    context.runtime.version = runtime.version
  }

  if (typeof context.registry === 'string') context.registry = { base: context.registry }
}

export { normalize }
