import { posix } from 'node:path'
import { Forbidden, NotFound } from '../../HTTP'
import * as schemas from './schemas'
import type { Maybe } from '@toa.io/types'
import type { Entry } from '@toa.io/extensions.storages'
import type { Readable } from 'node:stream'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'

import type { Directive, Input } from './types'

export class Fetch implements Directive {
  public readonly targeted = true

  private readonly permissions: Required<Permissions> = { blob: true, meta: false }
  private readonly discovery: Promise<Component>
  private storage: Component = null as unknown as Component

  public constructor (permissions: Permissions | null, discovery: Promise<Component>) {
    schemas.fetch.validate(permissions)

    Object.assign(this.permissions, permissions)
    this.discovery = discovery
  }

  public async apply (storage: string, request: Input): Promise<Output> {
    this.storage ??= await this.discovery

    const variant = posix.basename(request.url).includes('.')
    const metadata = request.subtype === 'octets.entry'

    if (!variant && metadata)
      if (this.permissions.meta)
        return this.get(storage, request)
      else
        throw new Forbidden('Metadata is not accessible.')

    if (!variant && !this.permissions.blob)
      throw new Forbidden('BLOB variant must be specified.')

    return await this.fetch(storage, request)
  }

  private async fetch (storage: string, request: Input): Promise<Output> {
    if ('if-none-match' in request.headers)
      return { status: 304 }

    const input = { storage, path: request.url }
    const result = await this.storage.invoke<Maybe<FetchResult>>('fetch', { input })

    if (result instanceof Error)
      throw new NotFound()

    const headers = new Headers({
      'content-type': result.type,
      'content-length': result.size.toString(),
      etag: result.checksum
    })

    return { headers, body: result.stream }
  }

  private async get (storage: string, request: Input): Promise<Output> {
    const input = { storage, path: request.url }
    const entry = await this.storage.invoke<Maybe<Entry>>('get', { input })

    if (entry instanceof Error)
      throw new NotFound()

    return { body: entry }
  }
}

export interface Permissions {
  blob?: boolean
  meta?: boolean
}

interface FetchResult {
  stream: Readable
  checksum: string
  size: number
  type: string
}
