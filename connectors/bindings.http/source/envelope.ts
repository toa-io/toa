import { Readable } from 'node:stream'
import type { Request } from '@toa.io/core/types'

/** The header a call travels in, beside the stream it carries as the body. */
export const HEADER = 'toa-request'

/** Where in the input the stream was taken from, so that it is put back where it was. */
export const PATH = 'toa-stream'

export interface Carried {
  /** the input property the stream was taken from, and its `stream` member where it has one */
  path: string
  stream: Readable
  /** what is left of the call once the stream is out of it */
  envelope: Request
}

/**
 * The stream a call carries, taken out of the input it was put in — the property itself where its
 * caller said nothing about it, and the property's `stream` where a route filled one. What is
 * handed back is a copy: the input belongs to whoever made the call.
 */
export function detach(request: Request): Carried | undefined {
  const input: unknown = request.input

  if (input === null || typeof input !== 'object') return undefined

  for (const [key, value] of Object.entries(input)) {
    if (value instanceof Readable)
      return { path: key, stream: value, envelope: without(request, key) }

    if (value !== null && typeof value === 'object' && 'stream' in value) {
      const property = value as Record<string, unknown>
      const stream: unknown = property.stream

      if (stream instanceof Readable) {
        const rest = { ...property }

        delete rest.stream

        return { path: key + '.stream', stream, envelope: without(request, key, rest) }
      }
    }
  }

  return undefined
}

/** Puts a stream back where the call carried it, on the side that serves the call. */
export function attach(request: Request, path: string, stream: Readable): void {
  const input = (request.input ?? {}) as Record<string, unknown>
  const [key, nested] = path.split('.')

  if (nested === undefined) input[key] = stream
  else {
    const property = (input[key] ?? {}) as Record<string, unknown>

    property[nested] = stream
    input[key] = property
  }

  request.input = input
}

/** What is left of a call once the stream is out of it. The input belongs to whoever made it. */
function without(request: Request, key: string, rest?: object): Request {
  const copy: Record<string, unknown> = { ...(request.input as object) }

  if (rest === undefined) delete copy[key]
  else copy[key] = rest

  return { ...request, input: copy }
}
