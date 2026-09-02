import { Image } from './image.js'
import { generate } from 'randomstring'

const version = '168b04ff'
const name = generate()

/**
 * @implements {toa.deployment.images.Image}
 */
class Class extends Image {
  get name () {
    return name
  }

  get version () {
    return version
  }
}

/** @type {toa.norm.context.Runtime} */
const runtime = {
  version: '0.0.0'
}

/** @type {toa.norm.context.Registry} */
const registry = {
  base: 'node:alpine'
}

export const scope = generate()

// distinct from the module's own `version` above
const published = 'ba2409fc'

// the fixture stands in for the global process
const current = process

export { name, Class, runtime, registry, current as process, published as version }
