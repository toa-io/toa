import { type Readable } from 'node:stream'
import { apply, type Callback } from './apply'

export function map<T = any, R = T> (stream: Readable, map: Callback<T, R>): Readable {
  return apply(stream, map)
}
