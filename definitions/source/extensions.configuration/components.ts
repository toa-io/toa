import { components as digest, type Components } from '../digest/read.js'

/** The values component, which runs in the service of its own. */
export function components(): Components {
  return digest('extensions.configuration')
}
