import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

import { createReadStream } from 'node:fs'
import { resolve } from 'node:path'
import { suites } from '../test/util.js'
import { providers } from './index.js'
import type { Constructor } from '../Provider.js'
import type { Metadata, Stream } from '../Entry.js'

const sample = resolve(import.meta.dirname, '../test/sample.jpeg')
const lenna = resolve(import.meta.dirname, '../test/lenna.png')

const metadata: Metadata = {
  type: 'image/jpeg',
  size: 73444,
  checksum: 'd41d8cd98f00b204e9800998ecf8427e',
  created: new Date().toISOString(),
  attributes: {}
}

for (const suite of suites)
  // a skipped suite still runs its hooks, and those reach the provider, so what
  // is skipped is the suite rather than each test in it
  (suite.run ? describe : describe.skip)(`${suite.provider}`, () => {
  const id = Math.random().toString(36).substring(7)
  const test = it
  const Provider: Constructor = providers[suite.provider]
  const provider = new Provider(suite.options, suite.secrets)

  describe('put, get, head', () => {
    let entry: Stream

    before(async () => {
      await provider.put(id, createReadStream(sample))
      await provider.commit(id, metadata)

      entry = await provider.get(id) as Stream
    })

    after(() => entry.stream.destroy())

    test('should create metadata', async () => {
      assert.deepStrictEqual(entry.size, metadata.size)
    })

    if (suite.provider !== 'cloudinary')
      test('should store attributes', async () => {
        const path = '/path/to/file'

        await provider.put(path, createReadStream(sample))
        await provider.commit(path, { ...metadata, attributes: { foo: 'bar' } })

        const entry = await provider.get(path) as Stream

        assert.deepStrictEqual(entry.attributes, { foo: 'bar' })

        entry.stream.destroy()
      })

    test('should overwrite', async () => {
      const path = Math.random().toString(36).substring(7)

      await provider.put(path, createReadStream(sample))
      await provider.commit(path, metadata)

      if (suite.provider === 'cloudinary')
        await new Promise((resolve) => setTimeout(resolve, 5_000))

      await assert.doesNotReject(provider.put(path, createReadStream(lenna)))

      const meta = { ...metadata, size: 473831 } // lenna size

      await provider.commit(path, meta)

      if (suite.provider === 'cloudinary')
        await new Promise((resolve) => setTimeout(resolve, 10_000))

      const overwritten = await provider.get(path) as Stream

      assert.deepStrictEqual(overwritten.size, meta.size)

      overwritten.stream.destroy()
    })

    test('should return error if not found', async () => {
      const error = await provider.get(Math.random().toString(36).substring(7)) as any

      assert.ok(error instanceof Error)
      assert.strictEqual(error.code, 'NOT_FOUND')
    })

    test('should return entry', async () => {
      const entry = await provider.head(id)

      assert.ok(!(entry instanceof Error))

      assert.deepStrictEqual(entry.size, metadata.size)
    })
  })

  describe('delete', () => {
    const path = '/path/to/' + Math.random().toString(36).substring(7)

    test('should remove file', async () => {
      await provider.put(path, createReadStream(sample))
      await provider.commit(path, metadata)
      await provider.delete(path)

      const error = await provider.get(path) as any

      assert.ok(error instanceof Error)
      assert.strictEqual(error.code, 'NOT_FOUND')
    })

    test('should not return error if not found', async () => {
      const empty = await provider.delete(Math.random().toString(36).substring(7))

      assert.strictEqual(empty, undefined)
    })
  })

  describe('move', () => {
    for (const committed of [true, false])
      test(`should move (commit: ${committed})`, async () => {
      const from = Math.random().toString(36).substring(7)
      const to = Math.random().toString(36).substring(7)

      await provider.put(from, createReadStream(sample))

      if (committed)
        await provider.commit(from, metadata)

      await provider.move(from, to)

      if (!committed)
        await provider.commit(to, metadata)

      const error = await provider.get(from) as any

      assert.ok(error instanceof Error)

      const entry = await provider.get(to) as Stream

      assert.notStrictEqual(entry.stream, undefined)
    })

    test('should return error if not found', async () => {
      const error = await provider.move(Math.random().toString(36).substring(7), 'whatever') as any

      assert.ok(error instanceof Error)
      assert.strictEqual(error.code, 'NOT_FOUND')
    })
  })
})

