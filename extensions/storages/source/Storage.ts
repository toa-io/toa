import { basename, dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { console, type SpanOptions } from 'openspan'
import { Scanner } from './Scanner'
import type { Readable } from 'node:stream'
import type { Attributes, Entry, Stream } from './Entry'
import type { ScanOptions } from './Scanner'
import type { Provider } from './Provider'

export class Storage<T extends Provider = Provider> {
  private readonly provider: T
  private readonly scope?: Scope

  public constructor (provider: T, scope?: Scope) {
    this.provider = provider
    this.scope = scope
  }

  public options (): T['options'] {
    return this.provider.options
  }

  public async put (path: string, stream: Readable, options?: Options): Maybe<Entry> {
    return await console.span(this.span('put', path), async () => {
      const scanner = new Scanner(options)
      const pipe = stream.pipe(scanner).on('error', () => undefined)
      const id = options?.id ?? randomUUID().replace(/-/g, '')
      const location = this.locate(path, id)

      /**
       * Provider can return or throw an error.
       * If thrown error is TYPE_MISMATCH from the Scanner, it should be returned.
       */
      const error: Error | undefined = await this.provider.put(location, pipe)
        .catch((error: any) => {
          if (error === scanner.error) return error
          else throw error
        })

      if (error instanceof Error)
        return error

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
    })
  }

  public async get (path: string, options?: unknown): Maybe<Stream> {
    return await console.span(this.span('get', dirname(path)), async () => {
      const location = this.locate(path)

      return await this.provider.get(location, options)
    })
  }

  public async head (path: string): Promise<Maybe<Entry>> {
    return await console.span(this.span('head', dirname(path)), async () => {
      const id = basename(path).split('.')[0]
      const location = this.locate(path)
      const metadata = await this.provider.head(location)

      if (metadata instanceof Error)
        return metadata

      return {
        id,
        ...metadata
      }
    })
  }

  public async delete (path: string): Maybe<void> {
    return await console.span(this.span('delete', dirname(path)), async () => {
      const location = this.locate(path)

      return await this.provider.delete(location)
    })
  }

  public path (): string | null {
    return this.provider.root ?? null
  }

  private locate (...rel: string[]): string {
    return join(ENTRIES, ...rel)
  }

  private span (method: string, path: string): SpanOptions {
    return {
      name: `${method} ${this.scope?.name ?? 'storage'}`,
      kind: 'client',
      attributes: {
        ...this.scope === undefined ? {} : { provider: this.scope.provider },
        path
      }
    }
  }
}

const ENTRIES = '/'

interface Options extends ScanOptions {
  id?: string
  origin?: string
  attributes?: Attributes
}

type Maybe<T> = Promise<T | Error>

export interface Scope {
  /** the logical storage name, e.g. `octets` */
  name: string

  /** the provider id, e.g. `s3` */
  provider: string
}

export type Storages = Record<string, Storage>
