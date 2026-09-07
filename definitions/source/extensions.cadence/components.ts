import { components as digest, type Components } from '../digest/read.js'

/** The components this extension ships, which run inside its own service. */
export function components(): Components {
  return digest('extensions.cadence')
}
