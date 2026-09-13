import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { once } from 'node:events'
import { PassThrough, Readable } from 'node:stream'
import { setTimeout } from 'node:timers/promises'
import * as streamConsumers from 'node:stream/consumers'
import { console } from 'openspan'
import { generate } from 'randomstring'
import * as msgpack from 'msgpackr'
import { multipart, read, write, type OutgoingMessage } from './messages.ts'
import { BadRequest, UnsupportedMediaType } from './exceptions.ts'
import { formats, types } from './formats/index.ts'
import { Timing } from './Timing.ts'
import type * as http from 'node:http'
import type { Context } from './Context.ts'

beforeEach(() => {
  resetCalls()
})

describe('read', () => {
  it('should parse application/json', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/json' }
    const input = { [generate()]: generate() }
    const json = JSON.stringify(input)
    const context = createContext(path, headers, json)
    const output = await read(context)

    assert.deepStrictEqual(output, input)
  })

  it('should parse application/yaml', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/yaml' }
    const yaml = 'foo: 1'
    const request = createContext(path, headers, yaml)
    const value = await read(request)

    assert.deepStrictEqual(value, { foo: 1 })
  })

  it('should parse application/mskpack', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/msgpack' }
    const input = { [generate()]: generate() }
    const msg = msgpack.encode(input)
    const request = createContext(path, headers, msg)
    const output = await read(request)

    assert.deepStrictEqual(output, input)
  })

  it('should parse text/plain', async () => {
    const path = generate()
    const headers = { 'content-type': 'text/plain' }
    const input = generate()
    const request = createContext(path, headers, input)
    const output = await read(request)

    assert.deepStrictEqual(output, input)
  })

  it('should parse application/json with charset parameter', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/json; charset=utf-8' }
    const input = { [generate()]: generate() }
    const json = JSON.stringify(input)
    const context = createContext(path, headers, json)
    const output = await read(context)

    assert.deepStrictEqual(output, input)
  })

  it('should throw on unsupported request media type', async () => {
    const path = generate()
    const headers = { 'content-type': 'wtf/' + generate() }
    const request = createContext(path, headers)

    await assert.rejects(read(request), UnsupportedMediaType)
  })

  it('should throw on malformed content', async () => {
    const path = generate()
    const text = '{ "foo": "val... oops '
    const headers = { 'content-type': 'application/json' }
    const request = createContext(path, headers, text)

    await assert.rejects(read(request), BadRequest)
  })

  it('should parse application/x-www-form-urlencoded', async () => {
    const headers = { 'content-type': 'application/x-www-form-urlencoded' }
    const form = 'grant_type=authorization_code&code=SplxlO&scope=a+b'
    const request = createContext(generate(), headers, form)

    assert.deepStrictEqual(await read(request), {
      grant_type: 'authorization_code',
      code: 'SplxlO',
      scope: 'a b'
    })
  })

  it('should read a repeated form name as the list it is', async () => {
    const headers = { 'content-type': 'application/x-www-form-urlencoded' }
    const request = createContext(generate(), headers, 'resource=one&resource=two')

    assert.deepStrictEqual(await read(request), { resource: ['one', 'two'] })
  })

  it('should not offer a form as a reply encoding', () => {
    assert.ok(
      !types.includes('application/x-www-form-urlencoded'),
      'a form is read and never written'
    )
  })

  it('should output correct mulitpart format', async () => {
    const response = new (class extends PassThrough {
      public readonly headers = new Headers()

      public setHeader(key: string, value: string): this {
        this.headers.set(key, value)

        return this
      }
    })()

    const context = createStreamContext()
    const message = {
      body: Readable.from(['Hello', 'New', 'World'])
    } as unknown as OutgoingMessage

    const framed = multipart(message, context, response as unknown as http.ServerResponse)

    const result = await streamConsumers.text(framed)

    assert.strictEqual(
      result,
      [
        '--cut',
        '',
        'ACK',
        '--cut',
        '',
        'Hello',
        '--cut',
        '',
        'New',
        '--cut',
        '',
        'World',
        '--cut',
        '',
        'FIN',
        '--cut--'
      ].join('\r\n')
    )
  })

  it('should destroy the body at once when destroyed', async () => {
    const body = new Readable({ objectMode: true, read: () => {} })
    const framed = frame(body)
    const closed = once(body, 'close')

    framed.resume()
    await setTimeout(10) // a pull is pending
    framed.destroy()

    await Promise.race([
      closed,
      setTimeout(100).then(() => assert.fail('body not destroyed'))
    ])
  })

  it('should end with FIN when aborted', async () => {
    const controller = new AbortController()
    const body = new Readable({ objectMode: true, read: () => {} })
    const framed = frame(body, controller.signal)
    const text = streamConsumers.text(framed)

    body.push('Hello')
    await setTimeout(10)
    controller.abort()

    const result = await text

    assert.ok(body.destroyed)
    assert.strictEqual(
      result,
      ['--cut', '', 'ACK', '--cut', '', 'Hello', '--cut', '', 'FIN', '--cut--'].join(
        '\r\n'
      )
    )
  })

  it('should fail with the body', async () => {
    const body = new Readable({ objectMode: true, read: () => {} })
    const framed = frame(body)
    const text = streamConsumers.text(framed)

    body.destroy(new Error('boom'))

    await assert.rejects(text, { message: 'boom' })
  })
})

describe('write', () => {
  let warn: ReturnType<typeof mock.method>

  beforeEach(() => {
    warn = mock.method(console, 'warn', () => undefined)
  })

  afterEach(() => {
    warn.mock.restore()
  })

  it('should not warn when the client closes a stream', async () => {
    const body = new Readable({ read: () => {} })
    const response = streamed(body)

    body.push('Hello')
    await setTimeout(10)
    response.destroy() // the client went away

    await closed(body)
    await setTimeout(10)

    assert.equal(warn.mock.callCount(), 0)
  })

  it('should warn on a stream error', async () => {
    const body = new Readable({ read: () => {} })

    streamed(body)
    body.destroy(new Error('boom'))

    await closed(body)
    await setTimeout(10)

    const messages = warn.mock.calls.map((call) => call.arguments[0])

    assert.ok(messages.includes('Message stream error'))
  })

  // the reply is made by the binding, which imports this package from its own copy: the gateway
  // image installs `@toa.io/core` beside the runtime, and again beside the extension
  it('should write the bytes of a reply another copy of the core encoded', async () => {
    const copy = await import('../../../../runtime/core/source/encoded.ts')

    const bytes = Buffer.from('{"id":"1"}')
    const headers = new Map<string, string>()
    const response = new PassThrough()

    Object.assign(response, {
      setHeader: (key: string, value: string) => headers.set(key, value),
      hasHeader: (key: string) => headers.has(key),
      appendHeader: () => response
    })

    const context = {
      ...createContext(generate()),
      encoder: formats['application/json'],
      pipelines: { response: [] }
    } as unknown as Context

    const written = streamConsumers.buffer(response)

    await write(context, response as unknown as http.ServerResponse, {
      body: new copy.Encoded(bytes)
    })

    assert.equal((await written).toString(), bytes.toString())
    assert.equal(headers.get('content-type'), 'application/json')
  })
})

function streamed(body: Readable): PassThrough {
  const response = new PassThrough()

  Object.assign(response, { setHeader: () => response })

  const context = {
    ...createContext(generate()),
    pipelines: { response: [] }
  } as unknown as Context

  const message: OutgoingMessage = {
    headers: new Headers({ 'content-type': 'text/plain' }),
    body
  }

  void write(context, response as unknown as http.ServerResponse, message)

  return response
}

// not `once`, which rejects on the `error` a destroyed stream emits before it closes
async function closed(stream: Readable): Promise<void> {
  await new Promise((resolve) => stream.on('close', resolve))
}

function frame(body: Readable, signal?: AbortSignal): Readable {
  const response = new PassThrough() as unknown as http.ServerResponse

  Object.assign(response, { setHeader: () => response })

  const context = createStreamContext(signal)

  return multipart({ body } as unknown as OutgoingMessage, context, response)
}

function createStreamContext(signal = new AbortController().signal): Context {
  return { encoder: formats['text/plain'], signal } as unknown as Context
}

export function createContext(
  url: string,
  headers: Record<string, string> = {},
  content: string | Buffer = ''
): Context {
  const data = Buffer.isBuffer(content) ? content : Buffer.from(content)
  const stream = Readable.from(data)
  let consumed = false

  const mock: Partial<Context> = {
    request: Object.assign(stream, {
      url,
      headers
    }) as unknown as Context['request'],
    url: new URL(url, 'https://host.local'),
    timing: new Timing(),
    signal: new AbortController().signal,
    buffer: async () => {
      if (consumed) throw new Error('Request body already consumed')

      consumed = true

      return data
    }
  }

  return mock as unknown as Context
}

function resetCalls(target = [], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
