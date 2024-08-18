import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createReadStream } from 'node:fs'
import assert from 'node:assert'
import { FileSystem } from './FileSystem'
import type { Entry, Metadata } from '../Entry'

let fs: FileSystem
let path: string

const metadata: Metadata = {
  type: Math.random().toString(36).substring(7),
  size: Math.round(Math.random() * 1000),
  created: Date.now()
}

beforeAll(async () => {
  path = await mkdtemp(join(tmpdir(), Math.random().toString(36).substring(7) + '-'))

  fs = new FileSystem({ path })
})

it('should expose root path', () => {
  expect(fs.root).toBe(path)
})

describe('put & get', () => {
  let entry: Entry

  beforeAll(async () => {
    await fs.put('foo', { stream: createReadStream(__filename), metadata })

    entry = await fs.get('foo') as Entry

    assert.ok(!(entry instanceof Error))
  })

  afterAll(() => entry.stream.destroy())

  it('should create metadata', async () => {
    expect(entry.metadata).toEqual(metadata)
  })

  it('should store attributes', async () => {
    const path = '/path/to/file'

    await fs.put(path, {
      stream: createReadStream(__filename),
      metadata: { ...metadata, attributes: { foo: 'bar' } }
    })

    const entry = await fs.get(path) as Entry

    expect(entry.metadata.attributes).toEqual({ foo: 'bar' })

    entry.stream.destroy()
  })

  it('should overwrite', async () => {
    const metadata: Metadata = {
      type: Math.random().toString(36).substring(7),
      size: Math.round(Math.random() * 1000),
      created: Date.now()
    }

    await expect(fs.put('foo', { stream: createReadStream(__filename), metadata }))
      .resolves.not.toThrow()

    const overwritten = await fs.get('foo') as Entry

    expect(overwritten.metadata).toEqual(metadata)

    overwritten.stream.destroy()
  })

  it('should return error if not found', async () => {
    const error = await fs.get(Math.random().toString(36).substring(7)) as any

    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe('NOT_FOUND')
  })
})

describe('delete', () => {
  const path = '/path/to/' + Math.random().toString(36).substring(7)

  it('should remove file', async () => {
    await fs.put(path, { stream: createReadStream(__filename), metadata })
    await fs.delete(path)

    const error = await fs.get(path) as any

    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe('NOT_FOUND')
  })

  it('should not return error if not found', async () => {
    const empty = await fs.delete(Math.random().toString(36).substring(7))

    expect(empty).toBeUndefined()
  })
})

describe('move', () => {
  it('should move', async () => {
    await fs.put('one', { stream: createReadStream(__filename), metadata })
    await fs.move('one', 'two')

    const error = await fs.get('one') as any

    expect(error).toBeInstanceOf(Error)

    const entry = await fs.get('two') as Entry

    expect(entry.metadata).toEqual(metadata)
  })

  it('should return error if not found', async () => {
    const error = await fs.move(Math.random().toString(36).substring(7), 'whatever') as any

    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe('NOT_FOUND')
  })
})
