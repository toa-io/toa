import { Readable } from 'node:stream'
import { randomUUID } from 'node:crypto'
import { buffer } from 'node:stream/consumers'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert'
import { Storage } from './Storage'
import { suites } from './test/util'
import { type Entry } from './Entry'
import { providers } from './providers'
import type { ProviderConstructor } from './Provider'

let storage: Storage
let dir: string

const suite = suites[0] // replace with 2 to run tests for S3

beforeAll(async () => {
  process.chdir(path.join(__dirname, 'test'))
})

beforeEach(() => {
  dir = '/' + randomUUID()

  const Provider: ProviderConstructor = providers[suite.provider]
  const provider = new Provider(suite.options)

  storage = new Storage(provider)
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
  let lenna: Entry
  let startCreation: number

  beforeEach(async () => {
    const stream = createReadStream('lenna.png')

    startCreation = Date.now()
    lenna = (await storage.put(dir, stream)) as Entry
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
    const copy = (await storage.put(dir2, stream)) as Entry

    expect(copy).toHaveProperty('id', lenna.id)
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
      variants: [],
      meta: {}
    })
  })

  it('should create entry', async () => {
    const entry = await storage.get(`${dir}/${lenna.id}`)

    expect(entry).toMatchObject({
      id: lenna.id,
      type: 'image/png',
      variants: [],
      meta: {}
    })
  })

  it('should set timestamp', async () => {
    const now = Date.now()
    const entry = (await storage.get(`${dir}/${lenna.id}`)) as Entry

    expect(entry.created).toBeLessThanOrEqual(now)
    expect(entry.created).toBeGreaterThanOrEqual(startCreation)
  })

  describe('existing entry', () => {
    it('should preserve meta', async () => {
      const path = `${dir}/${lenna.id}`
      const stream = createReadStream('lenna.png')

      await storage.annotate(path, 'foo', 'bar')
      await storage.put(dir, stream)

      const entry = await storage.get(path)

      expect(entry).toHaveProperty('meta', expect.objectContaining({ foo: 'bar' }))
    })
  })
})

describe('list', () => {
  let albert: Entry
  let lenna: Entry

  beforeEach(async () => {
    const stream0 = createReadStream('albert.jpg')
    const stream1 = createReadStream('lenna.png')

    albert = (await storage.put(dir, stream0)) as Entry
    lenna = (await storage.put(dir, stream1)) as Entry
  })

  it('should list entries', async () => {
    const list = await storage.list(dir)

    expect(list).toEqual([albert.id, lenna.id])
  })
})

describe('annotate', () => {
  let lenna: Entry

  beforeEach(async () => {
    const stream = createReadStream('lenna.png')

    lenna = (await storage.put(dir, stream)) as Entry
  })

  it('should set meta property', async () => {
    const path = `${dir}/${lenna.id}`

    await storage.annotate(path, 'foo', 'bar')

    const state0 = (await storage.get(path)) as Entry

    expect(state0).toHaveProperty('meta.foo', 'bar')

    await storage.annotate(path, 'foo')

    const state1 = (await storage.get(path)) as Entry

    expect(state1.meta).not.toHaveProperty('foo')
  })

  it('should set meta with object', async () => {
    const path = `${dir}/${lenna.id}`

    await storage.annotate(path, { foo: 1, bar: 'baz' })

    const state0 = (await storage.get(path)) as Entry

    expect(state0.meta).toStrictEqual({ foo: 1, bar: 'baz' })

    await storage.annotate(path, 'foo')

    const state1 = (await storage.get(path)) as Entry

    expect(state1.meta).not.toHaveProperty('foo')
  })
})

describe('variants', () => {
  let lenna: Entry

  beforeEach(async () => {
    const stream = createReadStream('lenna.png')

    lenna = (await storage.put(dir, stream)) as Entry
  })

  it('should add variant', async () => {
    const stream = createReadStream('sample.jpeg')

    const path = `${dir}/${lenna.id}`

    await storage.diversify(path, 'foo', stream)

    const state = (await storage.get(path)) as Entry

    expect(state).toHaveProperty('variants',
      expect.arrayContaining([{ name: 'foo', size: 73444, type: 'image/jpeg' }]))
  })

  it('should replace variant', async () => {
    const stream0 = createReadStream('sample.jpeg')
    const stream1 = createReadStream('sample.webp')
    const path = `${dir}/${lenna.id}`

    await storage.diversify(path, 'foo', stream0)
    await storage.diversify(path, 'foo', stream1)

    const state = (await storage.get(path)) as Entry

    expect(state).toHaveProperty('variants',
      expect.arrayContaining([expect.objectContaining({ name: 'foo', type: 'image/webp' })]))
  })
})

describe('fetch', () => {
  let lenna: Entry

  beforeEach(async () => {
    const stream = createReadStream('lenna.png')

    lenna = (await storage.put(dir, stream)) as Entry
  })

  it('should fetch', async () => {
    const path = `${dir}/${lenna.id}`
    const stream = await storage.fetch(path)

    assert.ok(stream instanceof Readable)

    const stored = await buffer(stream)
    const buf = await buffer(createReadStream('lenna.png'))

    expect(stored.compare(buf)).toBe(0)
  })

  it('should fetch blob by id', async () => {
    const stream = createReadStream('lenna.ascii')
    const entry = (await storage.put(dir, stream)) as Entry
    const stored = await storage.fetch(entry.id)

    if (stored instanceof Error) throw stored

    const buf = await buffer(stored)
    const expected = await buffer(createReadStream('lenna.ascii'))

    expect(buf.compare(expected)).toBe(0)
  })

  it('should fetch variant', async () => {
    const stream = createReadStream('sample.jpeg')

    const buf = await buffer(stream)
    const path = `${dir}/${lenna.id}`

    await storage.diversify(path, '100x100.jpeg', Readable.from(buf))

    const variant = await storage.fetch(`${path}.100x100.jpeg`)

    assert.ok(variant instanceof Readable)

    const stored = await buffer(variant)

    expect(stored.compare(buf)).toBe(0)
  })

  it('should not fetch blob by id and fake path', async () => {
    const stored = await storage.fetch(`fake/${lenna.id}`)

    expect(stored).toBeInstanceOf(Error)
    expect(stored).toHaveProperty('code', 'NOT_FOUND')
  })
})

describe('delete', () => {
  let lenna: Entry

  beforeEach(async () => {
    const stream = createReadStream('lenna.png')

    lenna = (await storage.put(dir, stream)) as Entry
  })

  it('should remove from the list', async () => {
    await storage.delete(`${dir}/${lenna.id}`)

    const list = await storage.list(dir)

    expect(list).not.toContain(lenna.id)
  })

  it('should delete entry', async () => {
    await storage.delete(`${dir}/${lenna.id}`)

    const result = await storage.get(`${dir}/${lenna.id}`)

    expect(result).toBeInstanceOf(Error)
    expect(result).toHaveProperty('code', 'NOT_FOUND')
  })

  it('should delete variants', async () => {
    const stream = createReadStream('sample.jpeg')

    const path = `${dir}/${lenna.id}`

    await storage.diversify(path, 'foo', stream)
    await storage.delete(`${dir}/${lenna.id}`)
    stream.destroy()

    const variant = await storage.fetch(`${path}.foo`)

    expect(variant).toBeInstanceOf(Error)
    expect(variant).toHaveProperty('code', 'NOT_FOUND')
  })

  it('should throw if path is not an entry', async () => {
    const result = await storage.delete(dir)

    expect(result).toBeInstanceOf(Error)
    expect(result).toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('move', () => {
  let lenna: Entry

  beforeEach(async () => {
    const stream = createReadStream('lenna.png')

    lenna = (await storage.put(dir, stream)) as Entry
  })

  it('should move entry', async () => {
    const path = `${dir}/${lenna.id}`
    const to = `${dir}/lenna`

    await storage.move(path, to)

    const entry = await storage.get(to)

    expect(entry).toMatchObject({ id: lenna.id, type: 'image/png' })
  })

  it('should move to subdirectory', async () => {
    const path = `${dir}/${lenna.id}`
    const to = `${dir}/sub/`

    await storage.move(path, to)

    const entry = await storage.get(to + lenna.id)

    expect(entry).toMatchObject({ id: lenna.id, type: 'image/png' })
  })

  it('should move to relative path', async () => {
    const path = `${dir}/${lenna.id}`
    const to = './sub/'

    await storage.move(path, to)

    const entry = await storage.get(`${dir}/sub/${lenna.id}`)

    expect(entry).toMatchObject({ id: lenna.id, type: 'image/png' })
  })

  it('should move variants', async () => {
    const stream = createReadStream('sample.jpeg')

    const path = `${dir}/${lenna.id}`

    await storage.diversify(path, 'foo', stream)
    await storage.move(path, `${dir}/lenna`)

    const variant = await storage.fetch(`${dir}/lenna.foo`)

    assert.ok(variant instanceof Readable)
  })
})

describe('signatures', () => {
  it.each(['jpeg', 'gif', 'webp', 'heic', 'jxl', 'avif'])('should detect image/%s',
    async (type) => {
      const stream = createReadStream('sample.' + type)

      const entry = (await storage.put(dir, stream)) as Entry

      expect(entry).toHaveProperty('type', 'image/' + type)
    })

  it.each(['avi'])('should detect video/%s',
    async (type) => {
      const stream = createReadStream('sample.' + type)

      const entry = (await storage.put(dir, stream)) as Entry

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

  const result = (await storage.put('hello', stream)) as Entry

  expect(result).not.toBeInstanceOf(Error)

  const stored = await storage.fetch(result.id)

  expect(stored).not.toBeInstanceOf(Error)
})

it('should store empty file', async () => {
  const stream = createReadStream('empty.txt')
  const result = (await storage.put('empty', stream)) as Entry

  expect(result).toHaveProperty('size', 0)

  const stored = (await storage.fetch(result.id)) as Readable

  expect(stored).not.toBeInstanceOf(Error)

  const buf = await buffer(stored)

  expect(buf).toHaveLength(0)
})
