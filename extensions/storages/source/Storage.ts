import { basename, dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { console, type SpanOptions } from 'openspan'
import { Scanner } from './Scanner.ts'
import { operation } from './measurements.ts'
import type { Readable } from 'node:stream'
import type { Attributes, Entry, Stream } from './Entry.ts'
import type { ScanOptions } from './Scanner.ts'
import type { Provider } from './Provider.ts'

export class Storage<T extends Provider = Provider> {
  private readonly provider: T
  private readonly scope?: Scope

  public constructor(provider: T, scope?: Scope) {
    this.provider = provider
    this.scope = scope
  }

  public options(): T['options'] {
    return this.provider.options
  }

  public async put(path: string, stream: Readable, options?: Options): Maybe<Entry> {
    return await console.span(this.span('put', path), async () => {
      const scanner = new Scanner(options)
      const pipe = stream.pipe(scanner).on('error', () => undefined)
      const id = options?.id ?? randomUUID().replace(/-/g, '')
      const location = this.locate(path, id)

      /**
       * Provider can return or throw an error.
       * If thrown error is TYPE_MISMATCH from the Scanner, it should be returned.
       */
      const error: Error | undefined = await this.provider
        .put(location, pipe)
        .catch((error: any) => {
          if (error === scanner.error) return error
          else throw error
        })

      if (error instanceof Error) return error

      const metadata: Entry = {
        id,
        size: scanner.size,
        type: scanner.type,
        checksum: scanner.digest(),
        created: new Date().toISOString(),
        attributes: options?.attributes ?? {}
      }

      if (options?.origin !== undefined) metadata.attributes.origin = options.origin

      await this.provider.commit(location, metadata)

      return metadata
    })
  }

  public async get(path: string, options?: unknown): Maybe<Stream> {
    return await console.span(this.span('get', dirname(path)), async () => {
      const location = this.locate(path)

      return await this.provider.get(location, options)
    })
  }

  public async head(path: string): Promise<Maybe<Entry>> {
    return await console.span(this.span('head', dirname(path)), async () => {
      const id = basename(path).split('.')[0]
      const location = this.locate(path)
      const metadata = await this.provider.head(location)

      if (metadata instanceof Error) return metadata

      return {
        id,
        ...metadata
      }
    })
  }

  public async delete(path: string): Maybe<void> {
    return await console.span(this.span('delete', dirname(path)), async () => {
      const location = this.locate(path)

      return await this.provider.delete(location)
    })
  }

  /**
   * Where the file is read straight from the provider, by whoever is given the address and with
   * no credentials of their own: a model, a browser, another service. A signed address is good for
   * `expires` seconds, an hour unless asked otherwise and a week at most. `NOT_FOUND` is a file the
   * storage does not have, where the provider can tell; `NO_URL` is a storage that serves no
   * address of its own.
   */
  public async url(path: string, options?: UrlOptions): Maybe<string> {
    return await console.span(this.span('url', dirname(path)), async () => {
      const expires = Math.min(options?.expires ?? HOUR, WEEK)

      return await this.provider.url(this.locate(path), expires)
    })
  }

  public path(): string | null {
    return this.provider.root ?? null
  }

  private locate(...rel: string[]): string {
    return join(ENTRIES, ...rel)
  }

  private span(method: string, path: string): SpanOptions {
    return {
      name: `${method} ${this.scope?.name ?? 'storage'}`,
      kind: 'client',
      attributes: {
        ...(this.scope === undefined ? {} : { provider: this.scope.provider }),
        path
      },
      measure: operation(method, this.scope)
    }
  }
}

const ENTRIES = '/'

/** How long a signed address is good for, unless asked otherwise, s. */
const HOUR = 60 * 60

/** The longest a signed address is good for: what S3 signs for, s. */
const WEEK = 7 * 24 * HOUR

export interface UrlOptions {
  /** Seconds a signed address is good for: an hour by default, a week at most. */
  expires?: number
}

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
