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
    const id = randomUUID().replace(/-/g, '')
    const location = this.locate(path, id)

    const temp: string | Error = await this.provider.put(location, pipe).catch((error: any) => {
      if (error === scanner.error) return error
      else throw error
    })

    if (temp instanceof Error)
      return temp

    const metadata: Entry = {
      id,
      size: scanner.size,
      type: scanner.type,
      checksum: scanner.digest(),
      created: new Date().toISOString(),
      attributes: options?.attributes ?? {}
    }

    if (options?.origin !== undefined)
      metadata.attributes.origin = options.origin

    await this.provider.commit(location, metadata)

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
