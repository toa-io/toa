import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { randomUUID } from 'node:crypto'
import { buffer } from 'node:stream/consumers'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { Storage } from './Storage.js'
import { suites } from './test/util.js'
import { providers } from './providers/index.js'
import type { Entry, Stream } from './Entry.js'
import type { Constructor } from './Provider.js'

const suite = suites[0]
const Provider: Constructor = providers[suite.provider]
const provider = new Provider(suite.options, suite.secrets)
const storage = new Storage(provider)
const dir = '/' + randomUUID()

before(async () => {
  process.chdir(path.join(__dirname, 'test'))
})

it('should be', async () => {
  assert.ok(storage instanceof Storage)
})

it('should return error if entry is not found', async () => {
  const result = await storage.get('not-found')

  assert.ok(result instanceof Error)
  assert.deepStrictEqual(result.code, 'NOT_FOUND')
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
    assert.ok(!(lenna instanceof Error))
  })

  it('should return entry id', async () => {
    assert.notStrictEqual(lenna.id, undefined)
    assert.strictEqual(lenna.id.length, 32)
  })

  it('should detect file type', async () => {
    assert.deepStrictEqual(lenna['type'], 'image/png')
  })

  it('should count size', async () => {
    assert.deepStrictEqual(lenna['size'], 473831)
  })

  it('should return entry', async () => {
    assert.partialDeepStrictEqual(lenna, {
      id: lenna.id,
      type: 'image/png',
      size: 473831,
      checksum: lenna.checksum,
      attributes: {}
    })
    assert.strictEqual(typeof lenna.created, 'string')
  })

  it('should create metadata', async () => {
    const entry = await storage.head(path) as Entry

    assert.partialDeepStrictEqual(entry, {
      type: 'image/png',
      size: 473831,
      checksum: lenna.checksum,
      attributes: {}
    })
    assert.strictEqual(typeof entry.created, 'string')
  })

  it('should set timestamp', async () => {
    const now = Date.now() + 1000 // Cloudinary has 1s resolution
    const entry = await storage.get(path) as Stream
    const created = new Date(entry.created).getTime()

    assert.ok(created <= now)
    assert.ok(created >= startCreation)
  })

  it('should store with given id', async () => {
    const stream = createReadStream('lenna.png')
    const id = Math.random().toString(36).slice(2)

    const entry = await storage.put(dir, stream, { id }) as Entry

    assert.strictEqual(entry.id, id)

    const check = await storage.head(`${dir}/${id}`)

    if (check instanceof Error)
      throw check

    assert.strictEqual(check.id, id)
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

    assert.strictEqual(stored.compare(new Uint8Array(buf.buffer)), 0)
  })

  it('should get entry', async () => {
    const entry = await storage.head(path) as Entry

    assert.strictEqual(entry.id, lenna.id)
  })

  if (suite.provider === 'cloudinary') {
    it('should return cloudinary url', async () => {
      const entry = await storage.head(`${path}.jpeg`) as Entry

      assert.match(entry.attributes.url, /^https:\/\//)
    })

    it('should support conditions', async () => {
      const entry = await storage.head(`${path}.vertical.jpeg`) as Entry

      assert.strictEqual(entry.attributes.url.includes('/if_w_gt_h/a_90/if_end/'), true)
    })

    it('should return entry id when requested with extensions', async () => {
      const entry = await storage.head(`${path}.jpeg`) as Entry

      assert.strictEqual(entry.id, lenna.id)
    })
  }
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

    assert.ok(result instanceof Error)
    assert.deepStrictEqual(result['code'], 'NOT_FOUND')
  })

  it('should not return error', async () => {
    const result = await storage.delete(dir)

    assert.strictEqual(result, undefined)
  })
})

describe('signatures', () => {
  for (const type of ['jpeg', 'gif', 'webp', 'heic', 'jxl', 'avif'])
    it(`should detect image/${type}`, async () => {
      const stream = createReadStream('sample.' + type)
      const entry = await storage.put(dir, stream) as Entry

      assert.deepStrictEqual(entry['type'], 'image/' + type)
    })

  for (const type of ['avi'])
     it(`should detect video/${type}`, async () => {
      const stream = createReadStream('sample.' + type)
      const entry = await storage.put(dir, stream) as Entry

      assert.deepStrictEqual(entry['type'], 'video/' + type)
    })

  for (const type of ['wav'])
     it(`should detect audio/${type}`, async () => {
      const stream = createReadStream('sample.' + type)
      const entry = (await storage.put(dir, stream)) as Entry

      assert.deepStrictEqual(entry['type'], 'audio/' + type)
    })

  it('should be ok with Arny', async () => {
    const stream = createReadStream('arny.jpg')
    const entry = (await storage.put(dir, stream)) as Entry

    assert.deepStrictEqual(entry['type'], 'image/jpeg')
  })
})

it('should return error if type doesn\'t match', async () => {
  const stream = createReadStream('sample.jpeg')

  const result = await storage.put(dir, stream, { claim: 'image/png' })

  assert.ok(result instanceof Error)
  assert.deepStrictEqual(result['code'], 'TYPE_MISMATCH')
})

it('should trust unknown types', async () => {
  const stream = createReadStream('lenna.ascii')

  const result = await storage.put(dir, stream, { claim: 'text/plain' })

  assert.ok(!(result instanceof Error))
  assert.deepStrictEqual(result['type'], 'text/plain')
})

it('should return error if type is identifiable', async () => {
  const stream = createReadStream('lenna.ascii')

  const result = await storage.put(dir, stream, { claim: 'image/jpeg' })

  assert.ok(result instanceof Error)
  assert.deepStrictEqual(result['code'], 'TYPE_MISMATCH')
})

it('should not return error if type application/octet-stream', async () => {
  const stream = createReadStream('sample.jpeg')

  const result = await storage.put(dir, stream, { claim: 'application/octet-stream' })

  assert.ok(!(result instanceof Error))
  assert.deepStrictEqual(result['type'], 'image/jpeg')
})

it('should return error if type is not acceptable', async () => {
  const stream = createReadStream('sample.jpeg')

  const result = await storage.put(dir, stream, { accept: 'image/png' })

  assert.ok(result instanceof Error)
  assert.deepStrictEqual(result['code'], 'NOT_ACCEPTABLE')
})

it('should accept wildcard types', async () => {
  const stream = createReadStream('sample.jpeg')

  const result = await storage.put(dir, stream, { accept: 'image/*' })

  assert.ok(!(result instanceof Error))
  assert.deepStrictEqual(result['type'], 'image/jpeg')
})

it('should handle root entries', async () => {
  const stream = createReadStream('sample.jpeg')
  const result = await storage.put('/', stream) as Entry

  assert.ok(!(result instanceof Error))

  const stored = await storage.get(result.id)

  assert.ok(!(stored instanceof Error))
})

it('should return error of stream size limit exceeded', async () => {
  const stream = createReadStream('sample.jpeg')
  const result = await storage.put(dir, stream, { limit: 1024 })

  assert.ok(result instanceof Error)
  assert.deepStrictEqual(result['code'], 'LIMIT_EXCEEDED')
})

if (suite.provider !== 'cloudinary')
  it('should add origin attribute', async () => {
    const origin = 'https://example.com/image.jpeg'
    const stream = createReadStream('sample.jpeg')
    const result = await storage.put('/origins', stream, { origin }) as Entry

    assert.ok(!(result instanceof Error))

    const entry = await storage.get('/origins/' + result.id)

    assert.ok(!(entry instanceof Error))

    assert.strictEqual(entry.attributes.origin, origin)
  })

it('should expose path', () => {
  const path = storage.path()

  assert.ok(typeof path === 'string' || path === null)
})
