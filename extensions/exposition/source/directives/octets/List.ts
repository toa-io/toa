import { posix } from 'node:path'
import { NotFound } from '../../HTTP'
import * as schemas from './schemas'
import type { Entry } from '@toa.io/extensions.storages'
import type { Maybe } from '@toa.io/types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'

import type { Directive, Input } from './types'

export class List implements Directive {
  public readonly targeted = false

  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor (value: null, discovery: Promise<Component>) {
    schemas.list.validate(value)

    this.discovery = discovery
  }

  public async apply (storage: string, request: Input): Promise<Output> {
    this.storage ??= await this.discovery

    const input = { storage, path: request.url }
    const list = await this.storage.invoke<Maybe<string[]>>('list', { input })

    if (list instanceof Error)
      throw new NotFound()

    const body = request.subtype === 'octets.entries'
      ? await this.expand(storage, request.url, list)
      : list

    return { body }
  }

  private async expand (storage: string, prefix: string, list: string[]):
  Promise<Array<Maybe<Entry>>> {
    const promises = list.map(async (id) => {
      const path = posix.join(prefix, id)
      const input = { storage, path }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.storage!.invoke<Maybe<Entry>>('get', { input })
    })

    return await Promise.all(promises)
  }
}
