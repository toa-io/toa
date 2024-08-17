import { Readable } from 'node:stream'
import { posix } from 'node:path'
import { buffer } from 'node:stream/consumers'
import { decode, encode } from 'msgpackr'
import { newid } from '@toa.io/generic'
import { Err } from 'error-value'
import { Scanner } from './Scanner'
import type { ScanOptions } from './Scanner'
import type { Provider } from './Provider'
import type { Entry } from './Entry'

export class Storage {
  private readonly provider: Provider

  public constructor (provider: Provider) {
    this.provider = provider
  }

  public async put (path: string, stream: Readable, options?: Options): Maybe<Entry> {
    const scanner = new Scanner(options)
    const pipe = stream.pipe(scanner)
    const tempname = await this.transit(pipe)

    if (scanner.error !== null)
      return scanner.error

    const id = scanner.digest()

    await this.persist(tempname, id)

    const entry: Entry = {
      id,
      size: scanner.size,
      type: scanner.type,
      origin: options?.origin,
      created: Date.now(),
      variants: [],
      meta: options?.meta ?? {}
    }

    return await this.create(path, entry)
  }

  public async get (path: string): Maybe<Entry> {
    const paths = this.destruct(path)
    const result = await this.provider.get(paths.metafile)

    if (result === null)
      return ERR_NOT_FOUND
    else
      return decode(await buffer(result))
  }

  public async fetch (path: string): Maybe<Readable> {
    const { rel, id, variant } = this.parse(path)

    if (this.provider.dynamic) {
      const blob = posix.join(BLOBs, id + '.' + variant)
      const stream = await this.provider.get(blob)

      if (stream === null)
        return ERR_NOT_FOUND
      else
        return stream
    }

    console.debug('TEMP', { path, rel, id, variant })

    if (variant === null && rel !== '') {
      const entry = await this.get(path)

      if (entry instanceof Error)
        return entry
    }

    const blob = variant === null
      ? posix.join(BLOBs, id)
      : posix.join(ENTRIES_ROOT, rel, id, variant)

    const stream = await this.provider.get(blob)

    if (stream === null)
      return ERR_NOT_FOUND
    else
      return stream
  }

  public async delete (path: string): Maybe<void> {
    const entry = await this.get(path)

    if (entry instanceof Error)
      return entry

    const paths = this.destruct(path)

    await Promise.all([
      this.provider.delete(paths.metafile),
      this.provider.delete(paths.vardir)
    ])
  }

  public async diversify (path: string, name: string, stream: Readable): Maybe<void> {
    const scanner = new Scanner()
    const pipe = stream.pipe(scanner)

    await this.provider.put(posix.join(ENTRIES_ROOT, path), name, pipe)

    if (scanner.error !== null)
      return scanner.error

    const { size, type } = scanner
    const entry = await this.get(path)

    if (entry instanceof Error)
      return entry

    entry.variants = entry.variants.filter((variant) => variant.name !== name)
    entry.variants.push({ name, size, type })

    await this.save(path, entry)
  }

  public path (): string | null {
    return this.provider.path
  }

  private async transit (stream: Readable): Promise<string> {
    const tempname = newid()

    await this.provider.put(TEMP, tempname, stream)

    return tempname
  }

  private async persist (tempname: string, id: string): Promise<void> {
    const temp = posix.join(TEMP, tempname)
    const blob = posix.join(BLOBs, id)

    await this.provider.move(temp, blob)
  }

  // eslint-disable-next-line max-params
  private async create (path: string, entry: Entry): Promise<Entry> {
    const metafile = posix.join(path, entry.id)

    await this.save(metafile, entry)

    return entry
  }

  private async save (path: string, entry: Entry): Promise<void> {
    const paths = this.destruct(path)
    const stream = Readable.from(encode(entry))

    await this.provider.put(paths.metadir, paths.ent, stream)
  }

  private parse (path: string): Path {
    const [last, ...segments] = path.split('/').reverse()
    const [id, ...rest] = last.split('.')
    const variant = rest.length > 0 ? rest.join('.') : null
    const rel = segments.reverse().join('/')

    return { rel, id, variant }
  }

  private destruct (path: string): Paths {
    const rel = posix.dirname(path)
    const dir = posix.join(ENTRIES_ROOT, rel)
    const ent = posix.basename(path)
    const metadir = posix.join(dir, ENTRIES_DIR)
    const metafile = posix.join(metadir, ent)
    const vardir = posix.join(dir, ent)

    return { rel, dir, ent, metadir, metafile, vardir }
  }
}

const ERR_NOT_FOUND = Err('NOT_FOUND')

const TEMP = '/temp'
const BLOBs = '/blobs'
const ENTRIES_ROOT = '/entries'
const ENTRIES_DIR = '.meta'

type Maybe<T> = Promise<T | Error>

interface Path {
  rel: string
  id: string
  variant: string | null
}

interface Paths {
  rel: string
  dir: string
  ent: string
  metadir: string
  metafile: string
  vardir: string
}

type Meta = Record<string, string>

interface Options extends ScanOptions {
  origin?: string
  meta?: Meta
}

export type Storages = Record<string, Storage>
