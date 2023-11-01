import { Readable } from 'node:stream'
import { match } from '@toa.io/match'
import { buffer } from '@toa.io/generic'
import { Storage } from './Storage'
import { cases, open, rnd } from './test/util'
import { type Entry } from './Entry'
import { providers } from './providers'

let storage: Storage
let dir: string

describe.each(cases)('%s', (_, url, secrets) => {
  beforeEach(() => {
    dir = '/' + rnd()

    const Provider = providers[url.protocol]
    const provider = new Provider(url, secrets)

    storage = new Storage(provider)
  })

  it('should be', async () => {
    expect(storage).toBeInstanceOf(Storage)
  })

  it('should return error if entry is not found', async () => {
    const result = await storage.get('not-found')

    if (!(result instanceof Error))
      throw new Error('Expected error')

    expect(result).toMatchObject({ code: 'NOT_FOUND', message: 'NOT_FOUND' })
  })

  describe('put', () => {
    let lenna: Entry

    beforeEach(async () => {
      const stream = open('lenna.png')

      lenna = await storage.put(dir, stream) as Entry
    })

    it('should not return error', async () => {
      expect(lenna).not.toBeInstanceOf(Error)
    })

    it('should return entry id', async () => {
      expect(lenna.id).toBeDefined()
    })

    it('should return id as checksum', async () => {
      const stream = open('lenna.png')
      const dir2 = '/' + rnd()
      const copy = await storage.put(dir2, stream) as Entry

      expect(copy.id).toBe(lenna.id)
    })

    it('should detect file type', async () => {
      expect(lenna.type).toBe('image/png')
    })

    it('should count size', async () => {
      expect(lenna.size).toBe(473831)
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

      match(entry,
        {
          id: lenna.id,
          type: 'image/png',
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

    describe('existing entry', () => {
      it('should unhide existing', async () => {
        const stream = open('lenna.png')
        const path = `${dir}/${lenna.id}`

        await storage.conceal(path)
        await storage.put(dir, stream)

        const list = await storage.list(dir)

        expect(list).toContainEqual(lenna.id)
      })

      it('should preserve meta', async () => {
        const path = `${dir}/${lenna.id}`
        const stream = open('lenna.png')

        await storage.annotate(path, 'foo', 'bar')
        await storage.put(dir, stream)

        const entry = await storage.get(path) as Entry

        expect(entry.meta).toMatchObject({ foo: 'bar' })
      })
    })
  })

  describe('list', () => {
    let albert: Entry
    let lenna: Entry

    beforeEach(async () => {
      const stream0 = open('albert.jpg')
      const stream1 = open('lenna.png')

      albert = await storage.put(dir, stream0) as Entry
      lenna = await storage.put(dir, stream1) as Entry
    })

    it('should list entries', async () => {
      const list = await storage.list(dir)

      expect(list).toMatchObject([albert.id, lenna.id])
    })

    it('should permutate', async () => {
      const error = await storage.permute(dir, [lenna.id, albert.id])

      expect(error).toBeUndefined()

      const list = await storage.list(dir)

      expect(list).toMatchObject([lenna.id, albert.id])
    })

    it('should return PERMUTATION_MISMATCH', async () => {
      const cases = [
        [lenna.id],
        [albert.id, lenna.id, 'unknown'],
        [lenna.id, lenna.id],
        [lenna.id, lenna.id, albert.id]
      ]

      for (const permutation of cases) {
        const error = await storage.permute(dir, permutation)

        expect(error).toBeInstanceOf(Error)
        expect(error).toMatchObject({ message: 'PERMUTATION_MISMATCH' })
      }
    })

    it('should exclude concealed', async () => {
      const path = `${dir}/${lenna.id}`

      await storage.conceal(path)

      const entries = await storage.list(dir)

      expect(entries).toMatchObject([albert.id])
    })

    it('should reveal', async () => {
      const path = `${dir}/${lenna.id}`

      await storage.conceal(path)
      await storage.reveal(path)
      await storage.reveal(path) // test that no duplicates are created

      const entries = await storage.list(dir)

      expect(entries).toMatchObject([albert.id, lenna.id])
    })

    it('should return ERR_NOT_FOOUD if entry doesnt exist', async () => {
      const path = `${dir}/oopsie`

      const methods: Array<'reveal' | 'conceal'> = ['reveal', 'conceal']

      for (const method of methods) {
        const error = await storage[method](path)

        expect(error).toBeInstanceOf(Error)
        expect(error).toMatchObject({ message: 'NOT_FOUND' })
      }
    })
  })

  describe('annotate', () => {
    let lenna: Entry

    beforeEach(async () => {
      const stream = open('lenna.png')

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

  describe('variants', () => {
    let lenna: Entry

    beforeEach(async () => {
      const stream = open('lenna.png')

      lenna = await storage.put(dir, stream) as Entry
    })

    it('should add variant', async () => {
      const stream = open('sample.jpeg')

      const path = `${dir}/${lenna.id}`

      await storage.diversify(path, 'foo', stream)

      const state = await storage.get(path) as Entry

      expect(state.variants).toMatchObject([{ name: 'foo', size: 73444, type: 'image/jpeg' }])
    })

    it('should replace variant', async () => {
      const stream0 = open('sample.jpeg')
      const stream1 = open('sample.webp')
      const path = `${dir}/${lenna.id}`

      await storage.diversify(path, 'foo', stream0)
      await storage.diversify(path, 'foo', stream1)

      const state = await storage.get(path) as Entry

      expect(state.variants).toMatchObject([{ name: 'foo', type: 'image/webp' }])
    })
  })

  describe('fetch', () => {
    let lenna: Entry

    beforeEach(async () => {
      const stream = open('lenna.png')

      lenna = await storage.put(dir, stream) as Entry
    })

    it('should fetch', async () => {
      const path = `${dir}/${lenna.id}`
      const stream = await storage.fetch(path)

      const stored: Buffer = await match(stream,
        Readable, async (stream: Readable) => await buffer(stream))

      const buf = await buffer(open('lenna.png'))

      expect(stored.compare(buf)).toBe(0)
    })

    it('should fetch blob by id', async () => {
      const stream = open('lenna.ascii')
      const entry = await storage.put(dir, stream) as Entry
      const stored = await storage.fetch(entry.id)

      if (stored instanceof Error)
        throw stored

      const buf = await buffer(stored)
      const expected = await buffer(open('lenna.ascii'))

      expect(buf.compare(expected)).toBe(0)
    })

    it('should fetch variant', async () => {
      const stream = open('sample.jpeg')

      const buf = await buffer(stream)
      const path = `${dir}/${lenna.id}`

      await storage.diversify(path, '100x100.jpeg', Readable.from(buf))

      const variant = await storage.fetch(`${path}.100x100.jpeg`)

      const stored = await match(variant,
        Readable, async (stream: Readable) => await buffer(stream))

      expect(stored.compare(buf)).toBe(0)
    })

    it('should not fetch blob by id and fake path', async () => {
      const stored = await storage.fetch(`fake/${lenna.id}`)

      match(stored,
        Error, (error: Error) => expect(error.message).toBe('NOT_FOUND'))
    })
  })

  describe('delete', () => {
    let lenna: Entry

    beforeEach(async () => {
      const stream = open('lenna.png')

      lenna = await storage.put(dir, stream) as Entry
    })

    it('should remove from the list', async () => {
      await storage.delete(`${dir}/${lenna.id}`)

      const list = await storage.list(dir)

      expect(list).not.toContain(lenna.id)
    })

    it('should delete entry', async () => {
      await storage.delete(`${dir}/${lenna.id}`)

      const result = await storage.get(`${dir}/${lenna.id}`)

      match(result,
        Error, (error: Error) => expect(error.message).toBe('NOT_FOUND'))
    })

    it('should delete variants', async () => {
      const stream = open('sample.jpeg')

      const path = `${dir}/${lenna.id}`

      await storage.diversify(path, 'foo', stream)
      await storage.delete(`${dir}/${lenna.id}`)

      const variant = await storage.fetch(`${path}.foo`)

      match(variant,
        Error, (error: Error) => expect(error.message).toBe('NOT_FOUND'))

      stream.destroy()
    })

    it('should throw if path is not an entry', async () => {
      const result = await storage.delete(dir)

      expect(result).toBeInstanceOf(Error)
      expect(result).toMatchObject({ message: 'NOT_FOUND' })
    })
  })

  describe('signatures', () => {
    it.each(['jpeg', 'gif', 'webp', 'heic', 'jxl', 'avif'])('should detect image/%s',
      async (type) => {
        const stream = open('sample.' + type)

        const entry = await storage.put(dir, stream) as Entry

        expect(entry.type).toBe('image/' + type)
      })
  })

  it('should return error if type doesnt match', async () => {
    const stream = open('sample.jpeg')

    const result = await storage.put(dir, stream, { claim: 'image/png' })

    match(result,
      Error, (error: Error) => expect(error.message).toBe('TYPE_MISMATCH'))
  })

  it('should trust unknown types', async () => {
    const stream = open('lenna.ascii')

    const result = await storage.put(dir, stream, { claim: 'text/plain' })

    expect(result).not.toBeInstanceOf(Error)
    expect(result).toMatchObject({ type: 'text/plain' })
  })

  it('should return error if type is identifiable', async () => {
    const stream = open('lenna.ascii')

    const result = await storage.put(dir, stream, { claim: 'image/jpeg' })

    expect(result).toBeInstanceOf(Error)
    expect(result).toMatchObject({ message: 'TYPE_MISMATCH' })
  })

  it('should not return error if type application/octet-stream', async () => {
    const stream = open('sample.jpeg')

    const result = await storage.put(dir, stream, { claim: 'application/octet-stream' })

    expect(result).not.toBeInstanceOf(Error)
    expect(result).toMatchObject({ type: 'image/jpeg' })
  })

  it('should return error if type is not acceptable', async () => {
    const stream = open('sample.jpeg')

    const result = await storage.put(dir, stream, { accept: 'image/png' })

    match(result,
      Error, (error: Error) => expect(error.message).toBe('NOT_ACCEPTABLE'))
  })

  it('should accept wildcard types', async () => {
    const stream = open('sample.jpeg')

    const result = await storage.put(dir, stream, { accept: 'image/*' })

    expect(result).not.toBeInstanceOf(Error)
    expect(result).toMatchObject({ type: 'image/jpeg' })
  })

  it('should handle root entries', async () => {
    const stream = open('sample.jpeg')

    const result = await storage.put('hello', stream) as Entry

    expect(result).not.toBeInstanceOf(Error)

    const stored = await storage.fetch(result.id)

    expect(stored).not.toBeInstanceOf(Error)
  })

  it('should store empty file', async () => {
    const stream = open('empty.txt')
    const result = await storage.put('empty', stream) as Entry

    expect(result.size).toBe(0)

    const stored = await storage.fetch(result.id) as Readable

    expect(stored).not.toBeInstanceOf(Error)

    const buf = await buffer(stored)

    expect(buf.length).toBe(0)
  })
})
