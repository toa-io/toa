import { Readable, PassThrough } from 'node:stream'
import { posix } from 'node:path'
import crypto from 'node:crypto'
import { decode, encode } from 'msgpackr'
import { buffer, newid, promex } from '@toa.io/generic'
import { match } from '@toa.io/match'
import { type Provider } from './Provider'
import { type Entry } from './Entry'
import { detect } from './signatures'

export class Storage {
  private readonly provider: Provider

  public constructor (provider: Provider) {
    this.provider = provider
  }

  public async get (path: string): Maybe<Entry> {
    const metaPath = STORAGE + path + '/.meta'
    const result = await this.provider.get(metaPath)

    return match(result,
      null, ERR_NOT_FOUND,
      async (stream: Readable) => decode(await buffer(stream)))
  }

  public async put (path: string, stream: Readable, type?: string): Maybe<Entry> {
    const hashing = this.hash(stream)
    const detecting = detect(stream, type)
    const tempname = await this.add(stream)
    const id = await hashing
    const mime = await detecting

    if (mime instanceof Error)
      return mime

    await this.move(tempname, id)

    return await this.create(path, id, mime)
  }

  public async list (path: string): Promise<Entry[]> {
    const entries = await this.provider.list(STORAGE + path)

    const reading = entries
      .map(async (id) => await this.get(posix.join(path, id)))

    const meta = await Promise.all(reading)

    return meta.filter((entry) => !(entry instanceof Error) && !entry.hidden) as Entry[]
  }

  public async hide (path: string): Maybe<void> {
    const entry = await this.get(path)

    if (entry instanceof Error)
      return entry

    entry.hidden = true

    await this.update(path, entry)
  }

  public async unhide (path: string): Maybe<void> {
    const entry = await this.get(path)

    if (entry instanceof Error)
      return entry

    entry.hidden = false

    await this.update(path, entry)
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

  private async move (tempname: string, id: string): Promise<void> {
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

    await this.provider.put(STORAGE + path, '.meta', stream)
  }
}

const ERR_NOT_FOUND = new Error('NOT_FOUND')

const TEMP = '/temp'
const BLOB = '/blob'
const STORAGE = '/storage'

type Maybe<T> = Promise<T | Error>
