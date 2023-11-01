import { NotFound } from '../../HTTP'
import type { Maybe } from '@toa.io/types'
import type { Entry } from '@toa.io/extensions.storages'
import type { Readable } from 'node:stream'
import type { Component } from '@toa.io/core'
import type { Output } from '../../Directive'

import type { Directive, Input } from './types'

export class Fetch implements Directive {
  public readonly targeted = true

  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor (_: any, discovery: Promise<Component>) {
    this.discovery = discovery
  }

  public async apply (storage: string, request: Input): Promise<Output> {
    this.storage ??= await this.discovery

    const input = { storage, path: request.path }
    const { entry, stream } = await this.storage.invoke<FetchResult>('fetch', { input })

    if (entry instanceof Error || stream instanceof Error)
      throw new NotFound()

    const headers = {
      'content-type': entry.type,
      'content-length': entry.size
    }

    return { headers, body: stream }
  }
}

interface FetchResult {
  entry: Maybe<Entry>
  stream: Maybe<Readable>
}
