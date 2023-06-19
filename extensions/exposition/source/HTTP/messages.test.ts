import { generate } from 'randomstring'
import * as msgpack from 'msgpackr'
import { OutgoingMessage, read, write } from './messages'
import { createRequest, res } from './Server.fixtures'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions'
import { Buffer } from 'node:buffer'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('read', () => {
  it('should read path and headers', async () => {
    const path = generate()
    const headers = { [generate()]: generate() }
    const request = createRequest({ path, headers })
    const message = await read(request)

    expect(message).toStrictEqual(expect.objectContaining({ path, headers }))
  })

  it('should parse application/json', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/json' }
    const value = { [generate()]: generate() }
    const json = JSON.stringify(value)
    const request = createRequest({ path, headers }, json)
    const message = await read(request)

    expect(message.value).toStrictEqual(value)
  })

  it('should parse application/yaml', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/yaml' }
    const yaml = 'foo: 1'
    const request = createRequest({ path, headers }, yaml)
    const message = await read(request)

    expect(message.value).toStrictEqual({ foo: 1 })
  })

  it('should parse application/mskpack', async () => {
    const path = generate()
    const headers = { 'content-type': 'application/msgpack' }
    const value = { [generate()]: generate() }
    const msg = msgpack.encode(value)
    const request = createRequest({ path, headers }, msg)
    const message = await read(request)

    expect(message.value).toStrictEqual(value)
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
    const message: OutgoingMessage = { headers: {}, value }
    const json = JSON.stringify(value)
    const buf = Buffer.from(json)
    const headers = { 'accept': 'application/json' }
    const request = createRequest({ headers }, buf)

    write(request, res, message)

    expect(res.set).toHaveBeenCalledWith('content-type', 'application/json')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith(buf)
  })

  it('should not write if no response', async () => {
    const headers = { 'accept': 'application/json' }
    const request = createRequest({ headers })
    const message: OutgoingMessage = { headers: {} }

    write(request, res, message)

    expect(res.set).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(204)
    expect(res.send).not.toHaveBeenCalled()
    expect(res.end).toHaveBeenCalled()
  })

  it('should throw on unsupported response media type', async () => {
    const headers = { 'accept': 'wtf/' + generate() }
    const request = createRequest({ headers })
    const message: OutgoingMessage = { headers: {}, value: 'hello' }

    expect(() => write(request, res, message)).toThrow(NotAcceptable)
  })

  it('should not throw unsupported media type if no response', async () => {
    const headers = { 'accept': 'wtf/' + generate() }
    const request = createRequest({ headers })
    const message: OutgoingMessage = { headers: {} }

    expect(() => write(request, res, message)).not.toThrow()
  })

  it('should use application/yaml as default', async () => {
    const request = createRequest()
    const message: OutgoingMessage = { headers: {}, value: 'hello' }

    write(request, res, message)

    expect(res.set).toHaveBeenCalledWith('content-type', 'application/yaml')
    expect(res.send).toHaveBeenCalled()
  })

  it('should negotiate', async () => {
    const headers = { 'accept': 'text/html, application/*;q=0.2, image/jpeg;q=0.8' }
    const request = createRequest({ headers })
    const message: OutgoingMessage = { headers: {}, value: 'hello' }

    write(request, res, message)

    expect(res.set).toHaveBeenCalledWith('content-type', 'application/yaml')
  })
})
