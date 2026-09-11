import { Image } from './image.js'
import { generate } from 'randomstring'

const reported = '168b04ff'
export const name = generate()

/**
 * @implements {toa.deployment.images.Image}
 */
export class Class extends Image {
  get name() {
    return name
  }

  get version() {
    return reported
  }
}

/** @type {toa.norm.context.Runtime} */
export const runtime = {
  version: '0.0.0'
}

/** @type {toa.norm.context.Registry} */
export const registry = {
  base: 'node:alpine'
}

export const scope = generate()

// distinct from the version `Class` reports
export const version = 'ba2409fc'

// the fixture stands in for the global process
export const process = globalThis.process
