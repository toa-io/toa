import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as fs from 'node:fs/promises'
import { type Readable } from 'node:stream'
import { buffer } from '@toa.io/streams'
import { providers } from './index'

const suites: Suite[] = [
  {
    run: true,
    ref: `file://${join(tmpdir(), 'toa-storages-file')}`
  },
  {
    run: true,
    ref: 'tmp://toa-storages-temp'
  }
  // add more providers here, use `run` as a condition to run the test
  // e.g.: `run: process.env.ACCESS_KEY_ID !== undefined`
]

const cases = suites
  .filter(({ run }) => run)
  .map(({ ref }) => {
    const url = new URL(ref)

    return [url.protocol, url]
  })

describe.each(cases)('%s', (protocol, url) => {
  const Provider = providers[protocol as keyof typeof providers]
  const provider = new Provider(url)

  let dir: string

  beforeEach(() => {
    dir = '/' + rnd()
  })

  it('should be', async () => {
    expect(provider).toBeInstanceOf(Provider)
  })

  it('should return null if file not found', async () => {
    const result = await provider.get(rnd())

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
    const list = await provider.list('/' + rnd())

    expect(list).toStrictEqual([])
  })

  it('should delete entry', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    await provider.put(dir, 'lenna.png', stream)
    await handle.close()
    await provider.delete(dir + '/lenna.png')

    const result = await provider.get(dir + '/lenna.png')

    expect(result).toBeNull()
  })

  it('should not throw if path does not exists', async () => {
    await expect(provider.delete(dir + '/whatever')).resolves.not.toThrow()
  })

  it('should move an entry', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    await provider.put(dir, 'lenna.png', stream)
    await handle.close()
    await provider.move(dir + '/lenna.png', dir + '/lenna2.png')

    const result = await provider.get(dir + '/lenna2.png') as Readable

    expect(result).not.toBeNull()

    const nope = await provider.get(dir + '/lenna.png')

    expect(nope).toBeNull()
  })
})

function rnd (): string {
  return Math.random().toString(36).slice(2)
}

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
  ref: string
}
