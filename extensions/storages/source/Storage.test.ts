import { randomUUID } from 'node:crypto'
import { buffer } from 'node:stream/consumers'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert'
import { Storage } from './Storage'
import { suites } from './test/util'
import { providers } from './providers'
import type { Entry, Metadata, Stream } from './Entry'
import type { Constructor } from './Provider'

jest.setTimeout(15_000)

const suite = suites[0]
const Provider: Constructor = providers[suite.provider]
const provider = new Provider(suite.options, suite.secrets)
const storage = new Storage(provider)
const dir = '/' + randomUUID()

beforeAll(async () => {
  process.chdir(path.join(__dirname, 'test'))
})

it('should be', async () => {
  expect(storage).toBeInstanceOf(Storage)
})

it('should return error if entry is not found', async () => {
  const result = await storage.get('not-found')

  expect(result).toBeInstanceOf(Error)
  expect(result).toMatchObject({ code: 'NOT_FOUND' })
})

describe('put', () => {
  let path: string
  let lenna: Entry
  let startCreation: number

  beforeEach(async () => {
    const stream = createReadStream('lenna.png')

    startCreation = Date.now()
    lenna = await storage.put(dir, stream) as Entry
    path = `${dir}/${lenna.id}`

    assert(!(lenna instanceof Error))
  })

  it('should not return error', async () => {
    expect(lenna).not.toBeInstanceOf(Error)
  })

  it('should return entry id', async () => {
    expect(lenna.id).toBeDefined()
  })

  it('should return id as checksum', async () => {
    const stream = createReadStream('lenna.png')
    const dir2 = '/' + randomUUID()
    const copy = await storage.put(dir2, stream) as Entry

    expect(copy).toHaveProperty('id', lenna.id)
    expect(copy.checksum).toBe(lenna.checksum)
  })

  it('should detect file type', async () => {
    expect(lenna).toHaveProperty('type', 'image/png')
  })

  it('should count size', async () => {
    expect(lenna).toHaveProperty('size', 473831)
  })

  it('should return entry', async () => {
    expect(lenna).toMatchObject({
      id: lenna.id,
      type: 'image/png',
      size: 473831,
      checksum: lenna.id,
      created: expect.any(String),
      attributes: {}
    } satisfies Entry)
  })

  it('should create metadata', async () => {
    const entry = await storage.head(path) as Entry

    expect(entry).toMatchObject({
      type: 'image/png',
      size: 473831,
      checksum: lenna.id,
      created: expect.any(String),
      attributes: {}
    } satisfies Metadata)
  })

  it('should set timestamp', async () => {
    const now = Date.now() + 1000 // Cloudinary has 1s resolution
    const entry = await storage.get(path) as Stream
    const created = new Date(entry.created).getTime()

    expect(created).toBeLessThanOrEqual(now)
    expect(created).toBeGreaterThanOrEqual(startCreation)
  })
})

describe('get, head', () => {
  let lenna: Entry
  let path: string

  beforeEach(async () => {
    const stream = createReadStream('lenna.png')

    lenna = await storage.put(dir, stream) as Entry

    path = `${dir}/${lenna.id}`
  })

  it('should get', async () => {
    const entry = await storage.get(path) as Stream
    const stored = await buffer(entry.stream)
    const buf = await buffer(createReadStream('lenna.png'))

    expect(stored.compare(buf)).toBe(0)
  })

  it('should get entry', async () => {
    const entry = await storage.head(path) as Entry

    expect(entry.id).toBe(lenna.id)
  })
})

describe('delete', () => {
  let lenna: Entry

  beforeEach(async () => {
    const stream = createReadStream('lenna.png')

    lenna = await storage.put(dir, stream) as Entry
  })

  it('should delete entry', async () => {
    await storage.delete(`${dir}/${lenna.id}`)

    // Cloudinary needs some time to invalidate the cache
    if (suite.provider === 'cloudinary')
      await new Promise((resolve) => setTimeout(resolve, 10_000))

    const result = await storage.get(`${dir}/${lenna.id}`)

    expect(result).toBeInstanceOf(Error)
    expect(result).toHaveProperty('code', 'NOT_FOUND')
  })

  it('should not return error', async () => {
    const result = await storage.delete(dir)

    expect(result).toBeUndefined()
  })
})

describe('signatures', () => {
  it.each(['jpeg', 'gif', 'webp', 'heic', 'jxl', 'avif'])('should detect image/%s',
    async (type) => {
      const stream = createReadStream('sample.' + type)
      const entry = await storage.put(dir, stream) as Entry

      expect(entry).toHaveProperty('type', 'image/' + type)
    })

  it.each(['avi'])('should detect video/%s',
    async (type) => {
      const stream = createReadStream('sample.' + type)
      const entry = await storage.put(dir, stream) as Entry

      expect(entry).toHaveProperty('type', 'video/' + type)
    })

  it.each(['wav'])('should detect audio/%s',
    async (type) => {
      const stream = createReadStream('sample.' + type)
      const entry = (await storage.put(dir, stream)) as Entry

      expect(entry).toHaveProperty('type', 'audio/' + type)
    })

  it('should be ok with Arny', async () => {
    const stream = createReadStream('arny.jpg')
    const entry = (await storage.put(dir, stream)) as Entry

    expect(entry).toHaveProperty('type', 'image/jpeg')
  })
})

it('should return error if type doesn\'t match', async () => {
  const stream = createReadStream('sample.jpeg')

  const result = await storage.put(dir, stream, { claim: 'image/png' })

  expect(result).toBeInstanceOf(Error)
  expect(result).toHaveProperty('code', 'TYPE_MISMATCH')
})

it('should trust unknown types', async () => {
  const stream = createReadStream('lenna.ascii')

  const result = await storage.put(dir, stream, { claim: 'text/plain' })

  expect(result).not.toBeInstanceOf(Error)
  expect(result).toHaveProperty('type', 'text/plain')
})

it('should return error if type is identifiable', async () => {
  const stream = createReadStream('lenna.ascii')

  const result = await storage.put(dir, stream, { claim: 'image/jpeg' })

  expect(result).toBeInstanceOf(Error)
  expect(result).toHaveProperty('code', 'TYPE_MISMATCH')
})

it('should not return error if type application/octet-stream', async () => {
  const stream = createReadStream('sample.jpeg')

  const result = await storage.put(dir, stream, { claim: 'application/octet-stream' })

  expect(result).not.toBeInstanceOf(Error)
  expect(result).toHaveProperty('type', 'image/jpeg')
})

it('should return error if type is not acceptable', async () => {
  const stream = createReadStream('sample.jpeg')

  const result = await storage.put(dir, stream, { accept: 'image/png' })

  expect(result).toBeInstanceOf(Error)
  expect(result).toHaveProperty('code', 'NOT_ACCEPTABLE')
})

it('should accept wildcard types', async () => {
  const stream = createReadStream('sample.jpeg')

  const result = await storage.put(dir, stream, { accept: 'image/*' })

  expect(result).not.toBeInstanceOf(Error)
  expect(result).toHaveProperty('type', 'image/jpeg')
})

it('should handle root entries', async () => {
  const stream = createReadStream('sample.jpeg')
  const result = await storage.put('/', stream) as Entry

  expect(result).not.toBeInstanceOf(Error)

  const stored = await storage.get(result.id)

  expect(stored).not.toBeInstanceOf(Error)
})

it('should return error of stream size limit exceeded', async () => {
  const stream = createReadStream('sample.jpeg')
  const result = await storage.put(dir, stream, { limit: 1024 })

  expect(result).toBeInstanceOf(Error)
  expect(result).toHaveProperty('code', 'LIMIT_EXCEEDED')
})

if (suite.provider !== 'cloudinary')
  it('should add origin attribute', async () => {
    const origin = 'https://example.com/image.jpeg'
    const stream = createReadStream('sample.jpeg')
    const result = await storage.put('/origins', stream, { origin }) as Entry

    assert.ok(!(result instanceof Error))

    const entry = await storage.get('/origins/' + result.id)

    assert.ok(!(entry instanceof Error))

    expect(entry.attributes.origin).toBe(origin)
  })

it('should expose path', () => {
  const path = storage.path()

  expect(typeof path === 'string' || path === null)
})
