import { Readable, PassThrough } from 'node:stream'
import { posix } from 'node:path'
import crypto from 'node:crypto'
import { decode, encode } from 'msgpackr'
import { buffer, newid, promex } from '@toa.io/generic'
import { type Provider } from './Provider'
import { type Entry } from './Entry'
import { detect } from './signatures'

export class Storage {
  private readonly provider: Provider

  public constructor (provider: Provider) {
    this.provider = provider
  }

  public async get (path: string): Maybe<Entry> {
    const metaPath = posix.join(STORAGE, path, '/.meta')
    const result = await this.provider.get(metaPath)

    if (result === null) return ERR_NOT_FOUND
    else return decode(await buffer(result))
  }

  public async put (path: string, stream: Readable, type?: string): Maybe<Entry> {
    const hashing = this.hash(stream)
    const detecting = detect(stream, type)
    const tempname = await this.add(stream)
    const id = await hashing
    const mime = await detecting

    if (mime instanceof Error)
      return mime

    await this.persist(tempname, id)

    return await this.create(path, id, mime)
  }

  public async fork (path: string, name: string, stream: Readable): Maybe<void> {
    const detecting = detect(stream)

    await this.provider.put(posix.join(STORAGE, path), name, stream)

    const type = await detecting

    if (type instanceof Error)
      return type

    const entry = await this.get(path)

    if (entry instanceof Error)
      return entry

    entry.variants = entry.variants.filter((variant) => variant.name !== name)
    entry.variants.push({ name, type })

    await this.update(path, entry)
  }

  public async list (path: string): Promise<Entry[]> {
    const entries = await this.provider.list(posix.join(STORAGE, path))

    const reading = entries
      .map(async (id) => await this.get(posix.join(path, id)))

    const meta = await Promise.all(reading)

    return meta.filter((entry) => !(entry instanceof Error) && !entry.hidden) as Entry[]
  }

  public async conceal (path: string): Maybe<void> {
    return await this.hide(path)
  }

  public async reveal (path: string): Maybe<void> {
    return await this.hide(path, false)
  }

  public async annotate (path: string, key: string, value?: unknown): Maybe<void> {
    const entry = await this.get(path)

    if (entry instanceof Error)
      return entry

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (value === undefined) delete entry.meta[key]
    else entry.meta[key] = value

    await this.update(path, entry)
  }

  private async add (stream: Readable): Promise<string> {
    const tempname = newid()
    const pass = new PassThrough()

    stream.pipe(pass)
    stream.on('close', () => pass.end())

    await this.provider.put(TEMP, tempname, pass)

    return tempname
  }

  private async hash (stream: Readable): Promise<string> {
    const hash = crypto.createHash('md5')
    const checksum = promex<string>()
    const pass = new PassThrough()

    stream.pipe(pass)
    stream.on('close', () => pass.end())
    pass.pipe(hash)
    hash.on('finish', () => checksum.resolve(hash.digest('hex')))

    return await checksum
  }

  private async persist (tempname: string, id: string): Promise<void> {
    const temp = posix.join(TEMP, tempname)
    const blob = posix.join(BLOB, id)

    await this.provider.move(temp, blob)
  }

  private async create (path: string, id: string, type: string): Promise<Entry> {
    const entry: Entry = {
      id,
      type,
      created: Date.now(),
      hidden: false,
      variants: [],
      meta: {}
    }

    await this.update(posix.join(path, entry.id), entry)

    return entry
  }

  private async update (path: string, entry: Entry): Promise<void> {
    const buffer = encode(entry)
    const stream = Readable.from(buffer)

    await this.provider.put(posix.join(STORAGE, path), '.meta', stream)
  }

  private async hide (path: string, value: boolean = true): Maybe<void> {
    const entry = await this.get(path)

    if (entry instanceof Error)
      return entry

    entry.hidden = value

    await this.update(path, entry)
  }
}

const ERR_NOT_FOUND = new Error('NOT_FOUND')

const TEMP = '/temp'
const BLOB = '/blob'
const STORAGE = '/storage'

type Maybe<T> = Promise<T | Error>
