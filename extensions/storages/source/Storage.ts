import { basename, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { Scanner } from './Scanner'
import type { Readable } from 'node:stream'
import type { Attributes, Entry, Stream } from './Entry'
import type { ScanOptions } from './Scanner'
import type { Provider } from './Provider'

export class Storage {
  private readonly provider: Provider

  public constructor (provider: Provider) {
    this.provider = provider
  }

  public async put (path: string, stream: Readable, options?: Options): Maybe<Entry> {
    const scanner = new Scanner(options)
    const pipe = stream.pipe(scanner).on('error', () => undefined)

    const temp: string | Error = await this.transit(path, pipe).catch((error: any) => {
      if (error === scanner.error) return error
      else throw error
    })

    if (temp instanceof Error)
      return temp

    const id = scanner.digest()

    const metadata: Entry = {
      id,
      size: scanner.size,
      type: scanner.type,
      checksum: id,
      created: new Date().toISOString(),
      attributes: options?.attributes ?? {}
    }

    if (options?.origin !== undefined)
      metadata.attributes.origin = options.origin

    const location = this.locate(path, id)

    await this.persist(temp, location, metadata)

    return metadata
  }

  public async get (path: string): Maybe<Stream> {
    const location = this.locate(path)

    return await this.provider.get(location)
  }

  public async head (path: string): Promise<Maybe<Entry>> {
    const id = basename(path)
    const location = this.locate(path)
    const metadata = await this.provider.head(location)

    if (metadata instanceof Error)
      return metadata

    return {
      id,
      ...metadata
    }
  }

  public async delete (path: string): Maybe<void> {
    const location = this.locate(path)

    return this.provider.delete(location)
  }

  public path (): string | null {
    return this.provider.root ?? null
  }

  private async transit (path: string, stream: Readable): Promise<string> {
    const location = this.locate(path, randomUUID())

    await this.provider.put(location, stream)

    return location
  }

  private async persist (from: string, to: string, entry: Entry): Promise<void> {
    await this.provider.move(from, to)
    await this.provider.commit(to, entry)
  }

  private locate (...rel: string[]): string {
    return join(ENTRIES, ...rel)
  }
}

const ENTRIES = '/'

interface Options extends ScanOptions {
  origin?: string
  attributes?: Attributes
}

type Maybe<T> = Promise<T | Error>

export type Storages = Record<string, Storage>
