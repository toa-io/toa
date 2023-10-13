import { type Readable } from 'node:stream'
import { apply, type Callback } from './apply'

export function filter<T = any> (stream: Readable, callback: Callback<T, boolean>): Readable {
  return apply<T>(stream, (chunk) => {
    const ok = callback(chunk)

    if (ok) return chunk
    else return undefined
  })
}
