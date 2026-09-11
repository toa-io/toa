import { components as digest, type Components } from '../digest/read.ts'

/** The identity components, which run inside the gateway. */
export function components(): Components {
  return digest('extensions.exposition')
}
