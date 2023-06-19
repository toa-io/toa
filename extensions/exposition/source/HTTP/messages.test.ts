import { generate } from 'randomstring'
import * as msgpack from 'msgpackr'
import { read } from './messages'
import { createRequest } from './Server.fixtures'
import { BadRequest, UnsupportedMediaType } from './exceptions'

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

it('should throw on unsupported media type', async () => {
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
