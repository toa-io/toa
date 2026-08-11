import { Locator } from '@toa.io/core'
import { consoleExporter, exporting } from 'openspan'
import { Aspect } from './Aspect'
import type { Span } from 'openspan'

const nativeFetch = globalThis.fetch

let aspect: Aspect
let fetchMock: jest.MockedFunction<typeof fetch>
let spans: Span[]

beforeEach(() => {
  aspect = new Aspect(new Locator('users', 'identity'))
  fetchMock = jest.fn()
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

  fetchMock.mockResolvedValue(response)

  const result = await aspect.invoke('create', 'https://example.com/items?secret=yes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}'
  })

  expect(result).toBe(response)
  expect(fetchMock).toHaveBeenCalledTimes(1)

  const request = fetchMock.mock.calls[0][0] as Request

  expect(request).toBeInstanceOf(Request)
  expect(request.method).toBe('POST')
  expect(request.url).toBe('https://example.com/items?secret=yes')
  await expect(request.text()).resolves.toBe('{}')
})

it('does not retry by default', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 503 }))

  const response = await aspect.invoke('get', 'https://example.com')

  expect(response.status).toBe(503)
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('retries unexpected responses and returns an expected response', async () => {
  fetchMock
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(new Response(null, { status: 201 }))

  const response = await aspect.invoke('create', 'https://example.com', {
    retry: { attempts: 3, expected: [201], delay: 0 }
  })

  expect(response.status).toBe(201)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('cancels an unexpected response body before retrying', async () => {
  const cancel = jest.fn()
  const body = new ReadableStream({ cancel })

  fetchMock
    .mockResolvedValueOnce(new Response(body, { status: 503 }))
    .mockResolvedValueOnce(new Response(null, { status: 200 }))

  await aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, delay: 0 }
  })

  expect(cancel).toHaveBeenCalledTimes(1)
})

it('continues retrying when response body cancellation fails', async () => {
  const body = new ReadableStream({
    cancel: () => {
      throw new Error('cancel failed')
    }
  })

  fetchMock
    .mockResolvedValueOnce(new Response(body, { status: 503 }))
    .mockResolvedValueOnce(new Response(null, { status: 200 }))

  const response = await aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, delay: 0 }
  })

  expect(response.status).toBe(200)
})

it('replays a regular request body', async () => {
  fetchMock
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(new Response(null, { status: 200 }))

  await aspect.invoke('create', 'https://example.com', {
    method: 'POST',
    body: 'hello',
    retry: { attempts: 2, delay: 0 }
  })

  const first = fetchMock.mock.calls[0][0] as Request
  const second = fetchMock.mock.calls[1][0] as Request

  await expect(first.text()).resolves.toBe('hello')
  await expect(second.text()).resolves.toBe('hello')
})

it('honors Retry-After instead of the configured delay', async () => {
  fetchMock
    .mockResolvedValueOnce(new Response(null, {
      status: 503,
      headers: { 'retry-after': '0' }
    }))
    .mockResolvedValueOnce(new Response(null, { status: 200 }))

  const response = await aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, delay: 60_000 }
  })

  expect(response.status).toBe(200)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('returns the last unexpected response', async () => {
  fetchMock
    .mockResolvedValueOnce(new Response(null, { status: 500 }))
    .mockResolvedValueOnce(new Response(null, { status: 502 }))

  const response = await aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, delay: 0 }
  })

  expect(response.status).toBe(502)
})

it('retries network errors and throws the final error', async () => {
  const first = new Error('first')
  const last = new Error('last')

  fetchMock.mockRejectedValueOnce(first).mockRejectedValueOnce(last)

  await expect(aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, delay: 0 }
  })).rejects.toBe(last)

  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('aborts while waiting for another attempt', async () => {
  const controller = new AbortController()

  fetchMock.mockResolvedValue(new Response(null, { status: 503 }))

  const promise = aspect.invoke('get', 'https://example.com', {
    signal: controller.signal,
    retry: { attempts: 2, delay: 60_000 }
  })

  await new Promise((resolve) => setImmediate(resolve))
  controller.abort(new Error('cancelled'))

  await expect(promise).rejects.toThrow('cancelled')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('rejects invalid retry options', async () => {
  await expect(aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 0 }
  })).rejects.toThrow('retry.attempts')

  await expect(aspect.invoke('get', 'https://example.com', {
    retry: { attempts: 2, expected: [] }
  })).rejects.toThrow('retry.expected')
})

it('rejects an explicit streaming body before sending it', async () => {
  const body = new ReadableStream()

  await expect(aspect.invoke('create', 'https://example.com', {
    method: 'POST',
    body,
    // Required by Node.js for a streaming request body.
    // @ts-expect-error -- duplex is implemented by Node but absent from lib.dom RequestInit.
    duplex: 'half',
    retry: { attempts: 2 }
  })).rejects.toThrow('non-replayable')

  expect(fetchMock).not.toHaveBeenCalled()
})

it('rejects a Request input with a body before retrying', async () => {
  const request = new Request('https://example.com', { method: 'POST', body: 'hello' })

  await expect(aspect.invoke('create', request, {
    retry: { attempts: 2 }
  })).rejects.toThrow('non-replayable')

  expect(fetchMock).not.toHaveBeenCalled()
})

it('creates a scoped parent span with a client span for each attempt', async () => {
  fetchMock
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))

  await aspect.invoke('update', 'https://example.com/items?token=secret', {
    method: 'PUT',
    retry: { attempts: 2, delay: 0 }
  })

  expect(spans).toHaveLength(3)

  const parent = spans.find((span) => span.name === 'PUT https://example.com')!
  const attempts = spans.filter((span) => span.parentId === parent.spanId)

  expect(parent).toMatchObject({
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
  expect(attempts).toMatchObject([
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
  expect(JSON.stringify(spans)).not.toContain('token=secret')
})

it('marks the span as failed after a final network error', async () => {
  fetchMock.mockRejectedValue(new Error('unavailable'))

  await expect(aspect.invoke('get', 'https://example.com')).rejects.toThrow('unavailable')

  expect(spans).toHaveLength(2)
  expect(spans.every((span) => span.status === 'error')).toBe(true)
})
