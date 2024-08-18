import assert from 'node:assert'
import { createReadStream } from 'node:fs'
import { suites } from '../test/util'
import { providers } from './index'
import type { Constructor } from '../Provider'
import type { Entry, Metadata } from '../Entry'

const metadata: Metadata = {
  type: Math.random().toString(36).substring(7),
  size: Math.round(Math.random() * 1000),
  created: Date.now()
}

describe.each(suites)('$provider', (suite) => {
  const it = suite.run ? global.it : global.it.skip
  const Provider: Constructor = providers[suite.provider]
  const provider = new Provider(suite.options)

  describe('put & get', () => {
    let entry: Entry

    beforeAll(async () => {
      await provider.put('foo', { stream: createReadStream(__filename), metadata })

      entry = await provider.get('foo') as Entry

      assert.ok(!(entry instanceof Error))
    })

    afterAll(() => entry.stream.destroy())

    it('should create metadata', async () => {
      expect(entry.metadata).toEqual(metadata)
    })

    it('should store attributes', async () => {
      const path = '/path/to/file'

      await provider.put(path, {
        stream: createReadStream(__filename),
        metadata: { ...metadata, attributes: { foo: 'bar' } }
      })

      const entry = await provider.get(path) as Entry

      expect(entry.metadata.attributes).toEqual({ foo: 'bar' })

      entry.stream.destroy()
    })

    it('should overwrite', async () => {
      const metadata: Metadata = {
        type: Math.random().toString(36).substring(7),
        size: Math.round(Math.random() * 1000),
        created: Date.now()
      }

      await expect(provider.put('foo', { stream: createReadStream(__filename), metadata }))
        .resolves.not.toThrow()

      const overwritten = await provider.get('foo') as Entry

      expect(overwritten.metadata).toEqual(metadata)

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
      await provider.put(path, { stream: createReadStream(__filename), metadata })
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
      await provider.put('one', { stream: createReadStream(__filename), metadata })
      await provider.move('one', 'two')

      const error = await provider.get('one') as any

      expect(error).toBeInstanceOf(Error)

      const entry = await provider.get('two') as Entry

      expect(entry.metadata).toEqual(metadata)
    })

    it('should return error if not found', async () => {
      const error = await provider.move(Math.random().toString(36).substring(7), 'whatever') as any

      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe('NOT_FOUND')
    })
  })
})
