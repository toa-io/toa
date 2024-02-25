import { Readable } from 'node:stream'
import { generate } from 'randomstring'
import * as msgpack from 'msgpackr'
import { read } from './messages'
import { BadRequest, UnsupportedMediaType } from './exceptions'
import { Timing } from './Timing'
import type { IncomingMessage } from './messages'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('read', () => {
  it('should parse application/json', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/json' }
    const input = { [generate()]: generate() }
    const json = JSON.stringify(input)
    const request = createRequest(path, headers, json)
    const output = await read(request)

    expect(output).toStrictEqual(input)
  })

  it('should parse application/yaml', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/yaml' }
    const yaml = 'foo: 1'
    const request = createRequest(path, headers, yaml)
    const value = await read(request)

    expect(value).toStrictEqual({ foo: 1 })
  })

  it('should parse application/mskpack', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/msgpack' }
    const input = { [generate()]: generate() }
    const msg = msgpack.encode(input)
    const request = createRequest(path, headers, msg)
    const output = await read(request)

    expect(output).toStrictEqual(input)
  })

  it('should parse text/plain', async () => {
    const path = generate()
    const headers = { 'content-type': 'text/plain' }
    const input = generate()
    const request = createRequest(path, headers, input)
    const output = await read(request)

    expect(output).toStrictEqual(input)
  })

  it('should throw on unsupported request media type', async () => {
    const path = generate()
    const headers = { 'content-type': 'wtf/' + generate() }
    const request = createRequest(path, headers)

    await expect(read(request)).rejects.toThrow(UnsupportedMediaType)
  })

  it('should throw on malformed content', async () => {
    const path = generate()
    const text = '{ "foo": "val... oops '
    const headers = { 'content-type': 'application/json' }
    const request = createRequest(path, headers, text)

    await expect(read(request)).rejects.toThrow(BadRequest)
  })
})

export function createRequest
(url: string, headers: Record<string, string> = {}, content: string | Buffer = ''):
jest.MockedObject<IncomingMessage> {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
  const stream = Readable.from(buffer)

  const mock: Partial<IncomingMessage> = {
    url,
    headers,
    timing: new Timing(false)
  }

  Object.assign(stream, mock)

  return stream as unknown as jest.MockedObject<IncomingMessage>
}
