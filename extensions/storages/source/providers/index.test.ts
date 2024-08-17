import path from 'node:path'
import { type Readable } from 'node:stream'
import { buffer } from 'node:stream/consumers'
import { readFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { suites } from '../test/util'
import { providers } from './index'
import type { ProviderConstructor } from '../Provider'

jest.setTimeout(20000)

describe.each(suites)('$provider', (suite) => {
  const it = suite.run ? global.it : global.it.skip
  const Provider: ProviderConstructor = providers[suite.provider]
  const provider = new Provider(suite.options, suite.secrets)

  let dir: string

  beforeAll(async () => {
    process.chdir(path.resolve(__dirname, '../test/'))
  })

  beforeEach(() => {
    dir = '/' + randomUUID()
  })

  it('should be', async () => {
    expect(provider).toBeInstanceOf(Provider)
  })

  it('should return null if file not found', async () => {
    const result = await provider.get(randomUUID())

    expect(result).toBeNull()
  })

  it('should create entry', async () => {
    const filename = 'lenna.png'
    const stream = createReadStream(filename)

    await provider.put(dir, filename, stream)

    const readable = await provider.get(dir + '/' + filename) as Readable
    const output = await buffer(readable)
    const lenna = await readFile(filename)

    expect(output.compare(lenna)).toBe(0)
  })

  it('should overwrite existing entry', async () => {
    const stream0 = createReadStream('lenna.png')
    const stream1 = createReadStream('albert.jpg')

    await provider.put(dir, 'lenna.png', stream0)
    await provider.put(dir, 'lenna.png', stream1)

    const readable = await provider.get(dir + '/lenna.png') as Readable
    const output = await buffer(readable)
    const albert = await readFile('albert.jpg')

    expect(output.compare(albert)).toBe(0)
  })

  it('should get by path', async () => {
    const stream = createReadStream('lenna.png')

    await provider.put(dir, 'lenna.png', stream)

    const result = await provider.get('/bar/lenna.png')

    expect(result).toBeNull()
  })

  describe('danger', () => {
    /*

    WHEN MAKING CHANGES TO DELETION,
    ALWAYS RUN TESTS IN STEP-BY-STEP DEBUGGING MODE

    YOU MAY EVENTUALLY DELETE YOUR ENTIRE FILE SYSTEM

                              Sincerely yours, Murphy

     */

    it('should delete entry', async () => {
      const stream = createReadStream('lenna.png')

      await provider.put(dir, 'lenna.png', stream)
      await provider.delete(dir + '/lenna.png')

      const result = await provider.get(dir + '/lenna.png')

      expect(result).toBeNull()
    })

    it('should not throw if path does not exists', async () => {
      await expect(provider.delete(dir + '/whatever')).resolves.not.toThrow()
    })

    it('should delete directory', async () => {
      const stream = createReadStream('lenna.png')

      await provider.put(dir, 'lenna.png', stream)
      await provider.delete(dir)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const result = await provider.get(dir + '/lenna.png')

      expect(result).toBeNull()
    })

    it('should move an entry', async () => {
      const filename = 'lenna.png'
      const stream = createReadStream(filename)
      const dir2 = '/' + randomUUID()

      await provider.put(dir, filename, stream)
      await provider.move(dir + '/' + filename, dir2 + '/' + filename)

      const result = await provider.get(dir2 + '/' + filename) as Readable

      expect(result).not.toBeNull()

      const nope = await provider.get(dir + '/' + filename)

      expect(nope).toBeNull()
    })
  })
})
