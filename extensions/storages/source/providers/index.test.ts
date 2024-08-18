import assert from 'node:assert'
import { createReadStream } from 'node:fs'
import { resolve } from 'node:path'
import { suites } from '../test/util'
import { providers } from './index'
import type { Constructor } from '../Provider'
import type { Entry, Metadata } from '../Entry'

const sample = resolve(__dirname, '../test/sample.jpeg')
const lenna = resolve(__dirname, '../test/lenna.png')

const metadata: Metadata = {
  type: 'image/jpeg',
  size: 73444,
  created: Date.now()
}

describe.each(suites)('$provider', (suite) => {
  const id = Math.random().toString(36).substring(7)
  const it = suite.run ? global.it : global.it.skip
  const Provider: Constructor = providers[suite.provider]
  const provider = new Provider(suite.options, suite.secrets)

  describe('put & get', () => {
    let entry: Entry

    beforeAll(async () => {
      await provider.put(id, { stream: createReadStream(sample), metadata })

      entry = await provider.get(id) as Entry

      assert.ok(!(entry instanceof Error))
    })

    afterAll(() => entry.stream.destroy())

    it('should create metadata', async () => {
      expect(entry.metadata.size).toEqual(metadata.size)
    })

    if (suite.provider !== 'cloudinary')
      it('should store attributes', async () => {
        const path = '/path/to/file'

        await provider.put(path, {
          stream: createReadStream(sample),
          metadata: { ...metadata, attributes: { foo: 'bar' } }
        })

        const entry = await provider.get(path) as Entry

        expect(entry.metadata.attributes).toEqual({ foo: 'bar' })

        entry.stream.destroy()
      })

    it('should overwrite', async () => {
      if (suite.provider === 'cloudinary')
        await new Promise((resolve) => setTimeout(resolve, 5_000))

      const meta = { ...metadata, size: 473831 } // lenna size

      await expect(provider.put(id, { stream: createReadStream(lenna), metadata: meta }))
        .resolves.not.toThrow()

      if (suite.provider === 'cloudinary')
        await new Promise((resolve) => setTimeout(resolve, 10_000))

      const overwritten = await provider.get(id) as Entry

      expect(overwritten.metadata.size).toEqual(meta.size)

      overwritten.stream.destroy()
    })

    it('should return error if not found', async () => {
      const error = await provider.get(Math.random().toString(36).substring(7)) as any

      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe('NOT_FOUND')
    })
  })

  describe('delete', () => {
    const path = '/path/to/' + Math.random().toString(36).substring(7)

    it('should remove file', async () => {
      await provider.put(path, { stream: createReadStream(sample), metadata })
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
    it('should move', async () => {
      const from = Math.random().toString(36).substring(7)
      const to = Math.random().toString(36).substring(7)

      await provider.put(from, { stream: createReadStream(sample), metadata })
      await provider.move(from, to)

      const error = await provider.get(from) as any

      expect(error).toBeInstanceOf(Error)

      const entry = await provider.get(to) as Entry

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
