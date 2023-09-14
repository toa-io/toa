import { Buffer } from 'node:buffer'
import { generate } from 'randomstring'
import * as msgpack from 'msgpackr'
import { type OutgoingMessage, read, write } from './messages'
import { createRequest, res } from './Server.fixtures'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('read', () => {
  it('should parse application/json', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/json' }
    const input = { [generate()]: generate() }
    const json = JSON.stringify(input)
    const request = createRequest({ path, headers }, json)
    const output = await read(request)

    expect(output).toStrictEqual(input)
  })

  it('should parse application/yaml', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/yaml' }
    const yaml = 'foo: 1'
    const request = createRequest({ path, headers }, yaml)
    const value = await read(request)

    expect(value).toStrictEqual({ foo: 1 })
  })

  it('should parse application/mskpack', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/msgpack' }
    const input = { [generate()]: generate() }
    const msg = msgpack.encode(input)
    const request = createRequest({ path, headers }, msg)
    const output = await read(request)

    expect(output).toStrictEqual(input)
  })

  it('should parse text/plain', async () => {
    const path = generate()
    const headers = { 'content-type': 'text/plain' }
    const input = generate()
    const request = createRequest({ path, headers }, input)
    const output = await read(request)

    expect(output).toStrictEqual(input)
  })

  it('should throw on unsupported request media type', async () => {
    const path = generate()
    const headers = { 'content-type': 'wtf/' + generate() }
    const request = createRequest({ path, headers })

    await expect(read(request)).rejects.toThrow(UnsupportedMediaType)
  })

  it('should throw on malformed content', async () => {
    const path = generate()
    const text = '{ "foo": "val... oops '
    const headers = { 'content-type': 'application/json' }
    const request = createRequest({ path, headers }, text)

    await expect(read(request)).rejects.toThrow(BadRequest)
  })
})

describe('write', () => {
  it('should write encoded response', async () => {
    const value = { [generate()]: generate() }
    const json = JSON.stringify(value)
    const buf = Buffer.from(json)
    const headers = { accept: 'application/json' }
    const request = createRequest({ headers }, buf)

    write(request, res, value)

    expect(res.set).toHaveBeenCalledWith('content-type', 'application/json')
    expect(res.send).toHaveBeenCalledWith(buf)
  })

  it('should throw on unsupported response media type', async () => {
    const headers = { accept: 'wtf/' + generate() }
    const request = createRequest({ headers })
    const value = generate()

    expect(() => {
      write(request, res, value)
    }).toThrow(NotAcceptable)
  })

  it('should use application/yaml as default', async () => {
    const request = createRequest()
    const message: OutgoingMessage = { headers: {}, body: 'hello' }

    write(request, res, message)

    expect(res.set).toHaveBeenCalledWith('content-type', 'application/yaml')
    expect(res.send).toHaveBeenCalled()
  })

  it('should negotiate', async () => {
    const headers = { accept: 'text/html, application/*;q=0.2, image/jpeg;q=0.8' }
    const request = createRequest({ headers })
    const message: OutgoingMessage = { headers: {}, body: 'hello' }

    write(request, res, message)

    expect(res.set).toHaveBeenCalledWith('content-type', 'application/yaml')
  })
})
