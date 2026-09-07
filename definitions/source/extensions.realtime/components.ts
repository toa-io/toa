import { components as digest, type Components } from '../digest/read.js'

export function components(): Components {
  return digest('extensions.realtime')
}
