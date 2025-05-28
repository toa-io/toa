import { Forbidden, NotFound } from '../../HTTP'
import * as schemas from './schemas'
import { Directive } from './Directive'
import type { Maybe } from '@toa.io/types'
import type { Entry, Stream } from '@toa.io/extensions.storages'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Input } from './types'

export class Get extends Directive {
  public readonly targeted = true

  private readonly options: Required<Options> = {
    meta: false
  }

  private readonly discovery: Promise<Component>
  private storage!: Component

  public constructor (options: Options | null, discovery: Promise<Component>) {
    super()

    schemas.get.validate(options)
    Object.assign(this.options, options)

    this.discovery = discovery
  }

  public async apply (storage: string, input: Input): Promise<Output> {
    this.storage ??= await this.discovery

    if (input.subtype === 'octets.entry')
      if (this.options.meta)
        return this.head(storage, input)
      else
        throw new Forbidden('Metadata is not accessible')
    else
      return await this.get(storage, input)
  }

  private async get (storage: string, input: Input): Promise<Output> {
    if ('if-none-match' in input.request.headers)
      return { status: 304 }

    const endpoint = input.request.method === 'GET' ? 'get' : 'head'

    const entry = await this.storage.invoke<Maybe<Stream>>(endpoint, {
      input: {
        storage,
        path: input.request.url,
        range: input.request.headers.range,
        agent: input.request.headers['user-agent']
      }
    })

    if (entry instanceof Error)
      throw new NotFound()

    const headers = new Headers({
      'content-type': entry.type,
      etag: `"${entry.checksum}"`
    })

    if (entry.range !== undefined)
      headers.set('content-range', entry.range)

    if (entry.size === null)
      headers.set('transfer-encoding', 'chunked')
    else
      headers.set('content-length', entry.size.toString())

    return {
      status: entry.range === undefined ? 200 : 206,
      headers,
      body: endpoint === 'get' ? entry.stream : undefined
    }
  }

  private async head (storage: string, input: Input): Promise<Output> {
    const entry = await this.storage.invoke<Maybe<Entry>>('head', {
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
  meta?: boolean
}
