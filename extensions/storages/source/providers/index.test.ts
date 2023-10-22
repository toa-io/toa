import { type Readable } from 'node:stream'
import { buffer } from '@toa.io/streams'
import { cases, open, rnd, read } from '../.test/util'
import { providers } from './index'

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

  it('should list directries', async () => {
    async function put (path: string, as: string): Promise<void> {
      const handle = await open('lenna.png')
      const stream = handle.createReadStream()

      await provider.put(path, as, stream)
      await handle.close()
    }

    await put(dir + '/foo', 'z.png')
    await put(dir + '/bar', 'a.png')

    const list = await provider.list(dir)

    expect(list).toStrictEqual(expect.arrayContaining(['foo', 'bar']))
  })

  it('should return empty list if path does not exists', async () => {
    const list = await provider.list('/' + rnd())

    expect(list).toStrictEqual([])
  })

  describe('danger', () => {
    /*

    WHEN MAKING CHANGES TO DELETION,
    ALWAYS RUN TESTS IN STEP-BY-STEP DEBUGGING MODE

    YOU MAY EVENTUALLY DELETE YOUR ENTIRE FILE SYSTEM

                              Sincerely yours, Murphy

     */

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

    it('should delete directory', async () => {
      const handle = await open('lenna.png')
      const stream = handle.createReadStream()

      await provider.put(dir, 'lenna.png', stream)
      await handle.close()
      await provider.delete(dir)

      const result = await provider.get(dir + '/lenna.png')

      expect(result).toBeNull()
    })

    it('should move an entry', async () => {
      const handle = await open('lenna.png')
      const stream = handle.createReadStream()
      const dir2 = '/' + rnd()

      await provider.put(dir, 'lenna.png', stream)
      await handle.close()
      await provider.move(dir + '/lenna.png', dir2 + '/lenna2.png')

      const result = await provider.get(dir2 + '/lenna2.png') as Readable

      expect(result).not.toBeNull()

      const nope = await provider.get(dir + '/lenna.png')

      expect(nope).toBeNull()
    })
  })
})
