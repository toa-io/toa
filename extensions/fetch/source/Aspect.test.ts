import { it, beforeEach, afterEach, mock } from 'node:test'
import type { Mock } from 'node:test'
import assert from 'node:assert/strict'

import { Locator } from '@toa.io/core'
import { consoleExporter, exporting } from 'openspan'
import { Aspect } from './Aspect.js'
import type { Span } from 'openspan'

const nativeFetch = globalThis.fetch

let aspect: Aspect
let fetchMock: Mock<typeof fetch>
let spans: Span[]

beforeEach(() => {
  aspect = new Aspect(new Locator('users', 'identity'))
  fetchMock = mock.fn()
  globalThis.fetch = fetchMock
  spans = []
  exporting([{ export: (span) => spans.push(span) }])
})

afterEach(() => {
  globalThis.fetch = nativeFetch
  exporting([consoleExporter])
})

it('delegates to native fetch and returns its Response', async () => {
  const response = new Response('ok', { status: 201, headers: { 'x-test': 'yes' } })

  fetchMock.mock.mockImplementation(async () => response)

  const result = await aspect.invoke('create', 'https://example.com/items?secret=yes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}'
  })

  assert.strictEqual(result, response)
  assert.strictEqual(fetchMock.mock.callCount(), 1)

  const request = fetchMock.mock.calls[0].arguments[0] as Request

  assert.ok(request instanceof Request)
  assert.strictEqual(request.method, 'POST')
  assert.strictEqual(request.url, 'https://example.com/items?secret=yes')
  await assert.strictEqual(await request.text(), '{}')
})

it('does not retry by default', async () => {
  fetchMock.mock.mockImplementation(async () => new Response(null, { status: 503 }))

  const response = await aspect.invoke('get', 'https://example.com')

  assert.strictEqual(response.status, 503)
  assert.strictEqual(fetchMock.mock.callCount(), 1)
})

it('retries unexpected responses and returns an expected response', async () => {
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 503 }), fetchMock.mock.callCount())
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 201 }), fetchMock.mock.callCount() + 1)

  const response = await aspect.invoke('create', 'https://example.com', {
    retry: { attempts: 3, expected: [201], delay: 0 }
  })

  assert.strictEqual(response.status, 201)
  assert.strictEqual(fetchMock.mock.callCount(), 2)
})

it('cancels an unexpected response body before retrying', async () => {
  const cancel = mock.fn()
  const body = new ReadableStream({ cancel })

  fetchMock.mock.mockImplementationOnce(async () => new Response(body, { status: 503 }), fetchMock.mock.callCount())
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 200 }), fetchMock.mock.callCount() + 1)

  await aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, delay: 0 }
  })

  assert.strictEqual(cancel.mock.callCount(), 1)
})

it('continues retrying when response body cancellation fails', async () => {
  const body = new ReadableStream({
    cancel: () => {
      throw new Error('cancel failed')
    }
  })

  fetchMock.mock.mockImplementationOnce(async () => new Response(body, { status: 503 }), fetchMock.mock.callCount())
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 200 }), fetchMock.mock.callCount() + 1)

  const response = await aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, delay: 0 }
  })

  assert.strictEqual(response.status, 200)
})

it('replays a regular request body', async () => {
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 503 }), fetchMock.mock.callCount())
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 200 }), fetchMock.mock.callCount() + 1)

  await aspect.invoke('create', 'https://example.com', {
    method: 'POST',
    body: 'hello',
    retry: { attempts: 2, delay: 0 }
  })

  const first = fetchMock.mock.calls[0].arguments[0] as Request
  const second = fetchMock.mock.calls[1].arguments[0] as Request

  await assert.strictEqual(await first.text(), 'hello')
  await assert.strictEqual(await second.text(), 'hello')
})

it('honors Retry-After instead of the configured delay', async () => {
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, {
      status: 503,
      headers: { 'retry-after': '0' }
    }), fetchMock.mock.callCount())
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 200 }), fetchMock.mock.callCount() + 1)

  const response = await aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, delay: 60_000 }
  })

  assert.strictEqual(response.status, 200)
  assert.strictEqual(fetchMock.mock.callCount(), 2)
})

it('returns the last unexpected response', async () => {
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 500 }), fetchMock.mock.callCount())
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 502 }), fetchMock.mock.callCount() + 1)

  const response = await aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, delay: 0 }
  })

  assert.strictEqual(response.status, 502)
})

it('retries network errors and throws the final error', async () => {
  const first = new Error('first')
  const last = new Error('last')

  fetchMock.mock.mockImplementationOnce(async () => { throw first }, fetchMock.mock.callCount())
  fetchMock.mock.mockImplementationOnce(async () => { throw last }, fetchMock.mock.callCount() + 1)

  await assert.rejects(aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, delay: 0 }
  }), (error: any) => { assert.strictEqual(error, last); return true })

  assert.strictEqual(fetchMock.mock.callCount(), 2)
})

it('aborts while waiting for another attempt', async () => {
  const controller = new AbortController()

  fetchMock.mock.mockImplementation(async () => new Response(null, { status: 503 }))

  const promise = aspect.invoke('get', 'https://example.com', {
    signal: controller.signal,
    retry: { attempts: 2, delay: 60_000 }
  })

  await new Promise((resolve) => setImmediate(resolve))
  controller.abort(new Error('cancelled'))

  await assert.rejects(promise, (error: any) => /cancelled/.test(error.message))
  assert.strictEqual(fetchMock.mock.callCount(), 1)
})

it('rejects invalid retry options', async () => {
  await assert.rejects(aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 0 }
  }), (error: any) => /retry\.attempts/.test(error.message))

  await assert.rejects(aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, expected: [] }
  }), (error: any) => /retry\.expected/.test(error.message))
})

it('rejects an explicit streaming body before sending it', async () => {
  const body = new ReadableStream()

  await assert.rejects(aspect.invoke('create', 'https://example.com', {
    method: 'POST',
    body,
    // Required by Node.js for a streaming request body.
    // @ts-expect-error -- duplex is implemented by Node but absent from lib.dom RequestInit.
    duplex: 'half',
    retry: { attempts: 2 }
  }), (error: any) => /non-replayable/.test(error.message))

  assert.strictEqual(fetchMock.mock.callCount(), 0)
})

it('rejects a Request input with a body before retrying', async () => {
  const request = new Request('https://example.com', { method: 'POST', body: 'hello' })

  await assert.rejects(aspect.invoke('create', request, {
    retry: { attempts: 2 }
  }), (error: any) => /non-replayable/.test(error.message))

  assert.strictEqual(fetchMock.mock.callCount(), 0)
})

it('creates a scoped parent span with a client span for each attempt', async () => {
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 503 }), fetchMock.mock.callCount())
  fetchMock.mock.mockImplementationOnce(async () => new Response(null, { status: 204 }), fetchMock.mock.callCount() + 1)

  await aspect.invoke('update', 'https://example.com/items?token=secret', {
    method: 'PUT',
    retry: { attempts: 2, delay: 0 }
  })

  assert.strictEqual(spans.length, 3)

  const parent = spans.find((span) => span.name === 'PUT https://example.com')!
  const attempts = spans.filter((span) => span.parentId === parent.spanId)

  assert.partialDeepStrictEqual(parent, {
    name: 'PUT https://example.com',
    kind: 'internal',
    scope: {
      namespace: 'identity',
      component: 'users',
      operation: 'update'
    },
    attributes: {
      'http.request.method': 'PUT',
      'http.response.status_code': 204,
      'url.scheme': 'https',
      'server.address': 'example.com',
      'retry.attempts': 2
    }
  })
  assert.partialDeepStrictEqual(attempts, [
    {
      name: 'attempt 1',
      kind: 'client',
      attributes: {
        'retry.attempt': 1,
        'http.response.status_code': 503
      }
    },
    {
      name: 'attempt 2',
      kind: 'client',
      attributes: {
        'retry.attempt': 2,
        'http.response.status_code': 204
      }
    }
  ])
  assert.ok(!(JSON.stringify(spans).includes('token=secret')))
})

it('marks the span as failed after a final network error', async () => {
  fetchMock.mock.mockImplementation(async () => { throw new Error('unavailable') })

  await assert.rejects(aspect.invoke('get', 'https://example.com'), (error: any) => /unavailable/.test(error.message))

  assert.strictEqual(spans.length, 2)
  assert.strictEqual(spans.every((span) => span.status === 'error'), true)
})
