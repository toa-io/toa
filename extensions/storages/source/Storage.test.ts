import { match } from '@toa.io/match'
import { Factory } from './Factory'
import { Storage } from './Storage'
import { open, rnd } from './.test/util'
import { type Entry } from './Entry'

let storage: Storage
let dir: string

const factory = new Factory()

beforeEach(() => {
  dir = '/' + rnd()
  storage = factory.createStorage('tmp://storage-test')
})

it('should be', async () => {
  expect(storage).toBeInstanceOf(Storage)
})

it('should return error if entry is not found', async () => {
  const result = await storage.get('not-found')

  match(result,
    Error, (error: Error) => expect(error.message).toBe('NOT_FOUND'))
})

describe('put', () => {
  let lenna: Entry

  beforeEach(async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()

    lenna = await storage.put(dir, stream) as Entry
  })

  it('should create an entry', async () => {
    expect(lenna).not.toBeInstanceOf(Error)
  })

  it('should return entry id', async () => {
    expect(lenna.id).toBeDefined()
  })

  it('should return id as checksum', async () => {
    const handle = await open('lenna.png')
    const stream = handle.createReadStream()
    const dir2 = '/' + rnd()
    const copy = await storage.put(dir2, stream) as Entry

    expect(copy.id).toBe(lenna.id)
  })

  it('should detect file type', async () => {
    expect(lenna.type).toBe('image/png')
  })
})

it.each(['jpeg', 'gif', 'webp', 'heic'])('should detect image/%s',
  async (type) => {
    const handle = await open('sample.' + type)
    const stream = handle.createReadStream()
    const entry = await storage.put(dir, stream) as Entry

    expect(entry.type).toBe('image/' + type)
  })
