import { match } from '@toa.io/match'
import { Factory } from './Factory'
import { Storage } from './Storage'
import { open, rnd } from './.test/util'
import { type Entry } from './Entry'

let storage: Storage
let dir: string

const factory = new Factory()

beforeEach(() => {
  dir = '/' + rnd()
  storage = factory.createStorage('tmp://storage-test')
})

it('should be', async () => {
  expect(storage).toBeInstanceOf(Storage)
})

it('should return error if entry is not found', async () => {
  const result = await storage.get('not-found')

  match(result,
    Error, (error: Error) => expect(error.message).toBe('NOT_FOUND'))
})

describe('put', () => {
  let lenna: Entry

  beforeEach(async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    lenna = await storage.put(dir, stream) as Entry
  })

  it('should not return error', async () => {
    expect(lenna).not.toBeInstanceOf(Error)
  })

  it('should return entry id', async () => {
    expect(lenna.id).toBeDefined()
  })

  it('should return id as checksum', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()
    const dir2 = '/' + rnd()
    const copy = await storage.put(dir2, stream) as Entry

    expect(copy.id).toBe(lenna.id)
  })

  it('should detect file type', async () => {
    expect(lenna.type).toBe('image/png')
  })

  it('should return entry', async () => {
    expect(lenna).toMatchObject({
      id: lenna.id,
      type: 'image/png',
      hidden: false,
      variants: [],
      meta: {}
    })
  })

  it('should create entry', async () => {
    const entry = await storage.get(`${dir}/${lenna.id}`)

    match(entry,
      {
        id: lenna.id,
        type: 'image/png',
        hidden: false,
        variants: [],
        meta: {}
      }, undefined)
  })

  it('should set timestamp', async () => {
    const now = Date.now()
    const entry = await storage.get(`${dir}/${lenna.id}`) as Entry

    expect(entry.created).toBeLessThanOrEqual(now)
    expect(entry.created).toBeGreaterThan(now - 100)
  })
})

describe('list', () => {
  let albert: Entry
  let lenna: Entry

  beforeEach(async () => {
    const handle0 = await open('albert.jpg')
    const stream0 = handle0.createReadStream()
    const handle1 = await open('lenna.png')
    const stream1 = handle1.createReadStream()

    albert = await storage.put(dir, stream0) as Entry
    lenna = await storage.put(dir, stream1) as Entry
  })

  it('should return entries', async () => {
    const entries = await storage.list(dir)

    expect(entries).toMatchObject([
      { id: albert.id },
      { id: lenna.id }
    ])
  })

  it('should exclude hidden', async () => {
    const path = `${dir}/${lenna.id}`

    await storage.hide(path)

    const entries = await storage.list(dir)

    expect(entries.length).toBe(1)
  })
})

describe('hidden', () => {
  let lenna: Entry

  beforeEach(async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    lenna = await storage.put(dir, stream) as Entry
  })

  it('should set hidden', async () => {
    const path = `${dir}/${lenna.id}`

    await storage.hide(path)

    const entry = await storage.get(path)

    match(entry,
      { hidden: true }, undefined)
  })

  it('should unhide', async () => {
    const path = `${dir}/${lenna.id}`

    await storage.hide(path)
    await storage.unhide(path)

    const entry = await storage.get(path)

    match(entry,
      { hidden: false }, undefined)
  })
})

describe('annotate', () => {
  let lenna: Entry

  beforeEach(async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    lenna = await storage.put(dir, stream) as Entry
  })

  it('should set meta', async () => {
    const path = `${dir}/${lenna.id}`

    await storage.annotate(path, 'foo', 'bar')

    const state0 = await storage.get(path) as Entry

    expect(state0.meta).toMatchObject({ foo: 'bar' })

    await storage.annotate(path, 'foo')

    const state1 = await storage.get(path) as Entry

    expect('foo' in state1.meta).toBe(false)
  })
})

it.each(['jpeg', 'gif', 'webp', 'heic'])('should detect image/%s',
  async (type) => {
    const handle = await open('sample.' + type)
    const stream = handle.createReadStream()
    const entry = await storage.put(dir, stream) as Entry

    expect(entry.type).toBe('image/' + type)
  })

it('should return error if type doesnt match', async () => {
  const handle = await open('sample.jpeg')
  const stream = handle.createReadStream()
  const result = await storage.put(dir, stream, 'image/png')

  match(result,
    Error, (error: Error) => expect(error.message).toBe('TYPE_MISMATCH'))
})
