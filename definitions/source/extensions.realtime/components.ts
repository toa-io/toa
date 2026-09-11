import { components as digest, type Components } from '../digest/read.ts'

export function components(): Components {
  return digest('extensions.realtime')
}
