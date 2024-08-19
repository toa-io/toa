import assert from 'node:assert'
import { createReadStream } from 'node:fs'
import { resolve } from 'node:path'
import { suites } from '../test/util'
import { providers } from './index'
import type { Constructor } from '../Provider'
import type { Metadata, Stream } from '../Entry'

const sample = resolve(__dirname, '../test/sample.jpeg')
const lenna = resolve(__dirname, '../test/lenna.png')

const metadata: Metadata = {
  type: 'image/jpeg',
  size: 73444,
  checksum: 'd41d8cd98f00b204e9800998ecf8427e',
  created: new Date().toISOString(),
  attributes: {}
}

describe.each(suites)('$provider', (suite) => {
  const id = Math.random().toString(36).substring(7)
  const it = suite.run ? global.it : global.it.skip
  const Provider: Constructor = providers[suite.provider]
  const provider = new Provider(suite.options, suite.secrets)

  describe('put, get, head', () => {
    let entry: Stream

    beforeAll(async () => {
      await provider.put(id, createReadStream(sample))
      await provider.commit(id, metadata)

      entry = await provider.get(id) as Stream
    })

    afterAll(() => entry.stream.destroy())

    it('should create metadata', async () => {
      expect(entry.size).toEqual(metadata.size)
    })

    if (suite.provider !== 'cloudinary')
      it('should store attributes', async () => {
        const path = '/path/to/file'

        await provider.put(path, createReadStream(sample))
        await provider.commit(path, { ...metadata, attributes: { foo: 'bar' } })

        const entry = await provider.get(path) as Stream

        expect(entry.attributes).toEqual({ foo: 'bar' })

        entry.stream.destroy()
      })

    it('should overwrite', async () => {
      const path = Math.random().toString(36).substring(7)

      await provider.put(path, createReadStream(sample))
      await provider.commit(path, metadata)

      if (suite.provider === 'cloudinary')
        await new Promise((resolve) => setTimeout(resolve, 5_000))

      await expect(provider.put(path, createReadStream(lenna)))
        .resolves.not.toThrow()

      const meta = { ...metadata, size: 473831 } // lenna size

      await provider.commit(path, meta)

      if (suite.provider === 'cloudinary')
        await new Promise((resolve) => setTimeout(resolve, 10_000))

      const overwritten = await provider.get(path) as Stream

      expect(overwritten.size).toEqual(meta.size)

      overwritten.stream.destroy()
    })

    it('should return error if not found', async () => {
      const error = await provider.get(Math.random().toString(36).substring(7)) as any

      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe('NOT_FOUND')
    })

    it('should return entry', async () => {
      const entry = await provider.head(id)

      assert.ok(!(entry instanceof Error))

      expect(entry.size).toEqual(metadata.size)
    })
  })

  describe('delete', () => {
    const path = '/path/to/' + Math.random().toString(36).substring(7)

    it('should remove file', async () => {
      await provider.put(path, createReadStream(sample))
      await provider.commit(path, metadata)
      await provider.delete(path)

      const error = await provider.get(path) as any

      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe('NOT_FOUND')
    })

    it('should not return error if not found', async () => {
      const empty = await provider.delete(Math.random().toString(36).substring(7))

      expect(empty).toBeUndefined()
    })
  })

  describe('move', () => {
    it.each([true, false])('should move (commit: %s)', async (committed) => {
      const from = Math.random().toString(36).substring(7)
      const to = Math.random().toString(36).substring(7)

      await provider.put(from, createReadStream(sample))

      if (committed)
        await provider.commit(from, metadata)

      await provider.move(from, to)

      if (!committed)
        await provider.commit(to, metadata)

      const error = await provider.get(from) as any

      expect(error).toBeInstanceOf(Error)

      const entry = await provider.get(to) as Stream

      expect(entry.stream).toBeDefined()
    })

    it('should return error if not found', async () => {
      const error = await provider.move(Math.random().toString(36).substring(7), 'whatever') as any

      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe('NOT_FOUND')
    })
  })
})

jest.setTimeout(30_000)
