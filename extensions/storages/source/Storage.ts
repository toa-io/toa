import { Readable, PassThrough } from 'node:stream'
import { posix } from 'node:path'
import { createHash } from 'node:crypto'
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
    const metapath = posix.join(ENTRIES, path, '/.meta')
    const result = await this.provider.get(metapath)

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

  public async diversify (path: string, name: string, stream: Readable): Maybe<void> {
    const detecting = detect(stream)

    await this.write(posix.join(ENTRIES, path), name, stream)

    const type = await detecting

    if (type instanceof Error)
      return type

    const entry = await this.get(path)

    if (entry instanceof Error)
      return entry

    entry.variants = entry.variants.filter((variant) => variant.name !== name)
    entry.variants.push({ name, type })

    await this.replace(path, entry)
  }

  public async fetch (path: string): Maybe<Readable> {
    const [last, ...segments] = path.split('/').reverse()
    const [id, ...rest] = last.split('.')
    const variant = rest.length > 0 ? rest.join('.') : null
    const dir = segments.reverse().join('/')

    const blob = variant === null
      ? posix.join(BLOBs, id)
      : posix.join(ENTRIES, dir, id, variant)

    const stream = await this.provider.get(blob)

    if (stream === null) return ERR_NOT_FOUND
    else return stream
  }

  public async list (path: string): Promise<Entry[]> {
    const entries = await this.provider.list(posix.join(ENTRIES, path))

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

    await this.replace(path, entry)
  }

  private async add (stream: Readable): Promise<string> {
    const tempname = newid()

    await this.write(TEMP, tempname, stream)

    return tempname
  }

  private async write (path: string, filname: string, stream: Readable): Promise<void> {
    const pass = new PassThrough()

    stream.pipe(pass)
    stream.on('close', () => pass.end())

    await this.provider.put(path, filname, pass)
  }

  private async hash (stream: Readable): Promise<string> {
    const hash = createHash('md5')
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
    const blob = posix.join(BLOBs, id)

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

    const metafile = posix.join(path, entry.id)
    const existing = await this.get(metafile)

    if (!(existing instanceof Error))
      Object.assign(entry, { ...existing, hidden: false })

    await this.replace(metafile, entry)

    return entry
  }

  private async replace (rel: string, entry: Entry): Promise<void> {
    const buffer = encode(entry)
    const stream = Readable.from(buffer)

    await this.provider.put(posix.join(ENTRIES, rel), '.meta', stream)
  }

  private async hide (path: string, value: boolean = true): Maybe<void> {
    const entry = await this.get(path)

    if (entry instanceof Error)
      return entry

    entry.hidden = value

    await this.replace(path, entry)
  }
}

const ERR_NOT_FOUND = new Error('NOT_FOUND')

const TEMP = '/temp'
const BLOBs = '/blobs'
const ENTRIES = '/entries'

type Maybe<T> = Promise<T | Error>
