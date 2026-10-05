import { exceptions } from '@toa.io/core'

/**
 * What a step answered, in the form it is kept in: something the journal's storage holds and the
 * broker carries as it is, and that gives back what the operation was given.
 */
export type Kept =
  | { value: unknown }
  | { none: true }
  | { bytes: string }
  | { error: Record<string, unknown> }
  | { response: KeptResponse }

interface KeptResponse {
  status: number
  statusText: string
  headers: Array<[string, string]>
  body: string | null
}

/**
 * A stream cannot be kept: it is read once, and what it would give back is whatever is left of it.
 * A `Response` is the exception, because what a `fetch` answers with is one, and it is read whole
 * to be kept.
 */
export async function encode(answer: unknown): Promise<Kept> {
  if (answer === undefined) return { none: true }

  if (answer instanceof Response) return { response: await response(answer) }

  if (streamed(answer))
    throw new exceptions.UnrecordableException(
      `a step answered with a stream, which is read once and cannot be given back`
    )

  if (ArrayBuffer.isView(answer))
    return {
      bytes: Buffer.from(answer.buffer, answer.byteOffset, answer.byteLength).toString(
        'base64'
      )
    }

  // a declared error a call answered with: its own properties are what the caller reads
  if (answer instanceof Error) return { error: { ...answer } }

  return { value: answer }
}

export function decode(kept: Kept): unknown {
  if ('none' in kept) return undefined
  if ('bytes' in kept) return Buffer.from(kept.bytes, 'base64')
  // the code is the message of the error a call answers with, which no copy of it carries
  if ('error' in kept)
    return Object.assign(new Error(kept.error.code as string), kept.error)
  if ('response' in kept) return revive(kept.response)

  return kept.value
}

async function response(answer: Response): Promise<KeptResponse> {
  const body =
    answer.body === null
      ? null
      : Buffer.from(await answer.arrayBuffer()).toString('base64')

  return {
    status: answer.status,
    statusText: answer.statusText,
    headers: [...answer.headers.entries()],
    body
  }
}

function revive(kept: KeptResponse): Response {
  const body = kept.body === null ? null : Buffer.from(kept.body, 'base64')

  return new Response(body, {
    status: kept.status,
    statusText: kept.statusText,
    headers: kept.headers
  })
}

function streamed(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false

  const object = value as Record<string | symbol, unknown>

  return (
    typeof object.pipe === 'function' ||
    typeof object.getReader === 'function' ||
    typeof object[Symbol.asyncIterator] === 'function'
  )
}
