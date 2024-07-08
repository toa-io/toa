import { posix } from 'node:path'
import { Forbidden, NotFound } from '../../HTTP'
import * as schemas from './schemas'
import { Directive } from './Directive'
import type { Readable } from 'node:stream'
import type { Maybe } from '@toa.io/types'
import type { Entry } from '@toa.io/extensions.storages'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Input } from './types'

export class Fetch extends Directive {
  public readonly targeted = true

  private readonly options: Required<Options> = {
    blob: true,
    meta: false
  }

  private readonly discovery: Promise<Component>
  private storage!: Component

  public constructor (options: Options | null, discovery: Promise<Component>) {
    super()

    schemas.fetch.validate(options)
    Object.assign(this.options, options)

    this.discovery = discovery
  }

  public async apply (storage: string, input: Input): Promise<Output> {
    this.storage ??= await this.discovery

    const variant = posix.basename(input.request.url).includes('.')
    const metadata = input.subtype === 'octets.entry'

    if (!variant && metadata)
      if (this.options.meta)
        return this.get(storage, input)
      else
        throw new Forbidden('Metadata is not accessible.')

    if (!variant && !this.options.blob)
      throw new Forbidden('BLOB variant must be specified.')

    return await this.fetch(storage, input)
  }

  private async fetch (storage: string, input: Input): Promise<Output> {
    if ('if-none-match' in input.request.headers)
      return { status: 304 }

    const result = await this.storage.invoke<Maybe<FetchResult>>('fetch', {
      input: {
        storage,
        path: input.request.url
      }
    })

    if (result instanceof Error)
      throw new NotFound()

    const headers = new Headers({
      'content-type': result.type,
      'content-length': result.size.toString(),
      etag: `"${result.checksum}"`
    })

    return {
      headers,
      body: result.stream
    }
  }

  private async get (storage: string, input: Input): Promise<Output> {
    const entry = await this.storage.invoke<Maybe<Entry>>('get', {
      input: {
        storage,
        path: input.request.url
      }
    })

    if (entry instanceof Error)
      throw new NotFound()

    return { body: entry }
  }
}

export interface Options {
  blob?: boolean
  meta?: boolean
}

interface FetchResult {
  stream: Readable
  checksum: string
  size: number
  type: string
}
