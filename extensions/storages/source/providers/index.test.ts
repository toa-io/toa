import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as fs from 'node:fs/promises'
import { type Readable } from 'node:stream'
import { buffer } from '@toa.io/streams'
import { providers } from './index'

const suites: Suite[] = [
  {
    run: true,
    schema: 'file:',
    args: [join(tmpdir(), 'toa-storages-file')]
  },
  {
    run: true,
    schema: 'tmp:',
    args: ['toa-storages-temp']
  }
  // add more providers here, use `run` as a condition to run the test
  // e.g.: `run: process.env.ACCESS_KEY_ID !== undefined`
]

const toRun = suites.filter(({ run }) => run).map(({ schema, args }) => [schema, args])

describe.each(toRun)('%s', (schema, args) => {
  const Provider = providers[schema as keyof typeof providers]
  const provider = new Provider(...args)

  let dir: string

  beforeEach(() => {
    dir = '/' + Math.random().toString(36).slice(2)
  })

  it('should be', async () => {
    expect(provider).toBeInstanceOf(Provider)
  })

  it('should return null if file not found', async () => {
    const result = await provider.get(Math.random().toString())

    expect(result).toBeNull()
  })

  it('should create entry', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    await provider.put(dir, 'lenna.png', stream)
    await handle.close()

    const readable = await provider.get(dir + '/lenna.png') as Readable
    const output = await buffer(readable)
    const lenna = await read('lenna.png')

    expect(output.compare(lenna)).toBe(0)
  })

  it('should overwrite existing entry', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    await provider.put(dir, 'lenna.png', stream)
    await handle.close()

    const handle2 = await open('albert.jpg')
    const stream2 = handle2.createReadStream()

    await provider.put(dir, 'lenna.png', stream2)
    await handle2.close()

    const readable = await provider.get(dir + '/lenna.png') as Readable
    const output = await buffer(readable)
    const albert = await read('albert.jpg')

    expect(output.compare(albert)).toBe(0)
  })

  it('should get by path', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    await provider.put(dir, 'lenna.png', stream)
    await handle.close()

    const result = await provider.get('/bar/lenna.png')

    expect(result).toBeNull()
  })

  it('should list entries', async () => {
    async function put (as: string): Promise<void> {
      const handle = await open('lenna.png')
      const stream = handle.createReadStream()

      await provider.put(dir, as, stream)
      await handle.close()
    }

    await put('z.png')
    await put('a.png')

    const list = await provider.list(dir)

    // alphabetical order
    expect(list).toStrictEqual(['a.png', 'z.png'])
  })

  it('should return empty list if path does not exists', async () => {
    const list = await provider.list('/' + Math.random().toString(36).slice(2))

    expect(list).toStrictEqual([])
  })

  it('should create symlink', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    await provider.put(dir, 'lenna.png', stream)
    await provider.link(dir + '/lenna.png', dir + '/lenna2.png')
    await handle.close()

    const result = await provider.get(dir + '/lenna2.png') as Readable
    const output = await buffer(result)
    const lenna = await read('lenna.png')

    expect(output.compare(lenna)).toBe(0)

    const list = await provider.list(dir)

    expect(list).toStrictEqual(['lenna.png', 'lenna2.png'])
  })

  it('should delete entry', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    await provider.put(dir, 'lenna.png', stream)
    await provider.delete(dir + '/lenna.png')
    await handle.close()

    const result = await provider.get(dir + '/lenna.png')

    expect(result).toBeNull()
  })

  it('should not throw if path does not exists', async () => {
    await expect(provider.delete(dir + '/whatever')).resolves.not.toThrow()
  })

  it('should delete symlinks of deleted entry', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    await provider.put(dir, 'lenna.png', stream)
    await provider.link(dir + '/lenna.png', dir + '/lenna2.png')
    await provider.delete(dir + '/lenna.png')
    await handle.close()

    const result = await provider.get(dir + '/lenna2.png')

    expect(result).toBeNull()
  })

  it('should move an entry', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    await provider.put(dir, 'lenna.png', stream)
    await provider.move(dir + '/lenna.png', dir + '/lenna2.png')
    await handle.close()

    const result = await provider.get(dir + '/lenna2.png') as Readable

    expect(result).not.toBeNull()

    const nope = await provider.get(dir + '/lenna.png')

    expect(nope).toBeNull()
  })
})

async function open (rel: string): Promise<fs.FileHandle> {
  const path = join(__dirname, './.assets', rel)

  return await fs.open(path, 'r')
}

async function read (rel: string): Promise<Buffer> {
  const handle = await open(rel)
  const buffer = await handle.readFile()

  await handle.close()

  return buffer
}

interface Suite {
  run: boolean
  schema: string
  args: any[]
}
