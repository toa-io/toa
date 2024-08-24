/* eslint-disable max-depth */

import { Readable } from 'node:stream'
import { buffer } from 'node:stream/consumers'

import Cache from '@isaacs/ttlcache'
import Policy from 'http-cache-semantics'
import type { ReadableStream } from 'node:stream/web'

const cache = new Cache<string, Entry>()

export async function get (url: string, init?: RequestInit): Promise<Response> {
  const headers = toRecord(init?.headers)
  const request = { url, method: 'GET', headers }
  const cached = cache.get(url)

  if (cached?.policy.satisfiesWithoutRevalidation(request) === true) {
    const headers = toHeaders(cached.policy.responseHeaders())

    return new Response(cached.body, { headers })
  }

  // check request
  const response = await fetch(url, init)

  const policy = new Policy(request, { status: response.status, headers: toRecord(response.headers) })
  const ttl = policy.timeToLive()

  if (policy.storable() && ttl > 0) {
    const body = await toBuffer(response.body as ReadableStream)

    cache.set(url, { policy, body }, { ttl })

    return new Response(body, { headers: response.headers })
  } else
    return response
}

function toRecord (headers: RequestInit['headers']): Record<string, string> {
  if (!(headers instanceof Headers))
    headers = toHeaders(headers)

  return Object.fromEntries(headers.entries())
}

function toHeaders (values?: Array<[string, string]> | Record<string, string | string[] | undefined>): Headers {
  const headers = new Headers()

  if (values === undefined)
    return headers

  if (Array.isArray(values))
    for (const [name, value] of values)
      headers.append(name, value)
  else
    for (const name in values) {
      const value = values[name]

      if (value === undefined)
        continue

      if (Array.isArray(value))
        for (const v of value)
          headers.append(name, v)
      else
        headers.append(name, value)
    }

  return headers
}

async function toBuffer (body: ReadableStream<Uint8Array> | null): Promise<Buffer | null> {
  if (body === null)
    return null

  const buf = await buffer(Readable.fromWeb(body as ReadableStream))

  return Buffer.from(buf)
}

interface Entry {
  policy: Policy
  body: Buffer | null
}
