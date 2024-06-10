import { posix } from 'node:path'
import { Forbidden, NotFound } from '../../HTTP'
import * as schemas from './schemas'
import { Directive } from './Directive'
import type { Entry } from '@toa.io/extensions.storages'
import type { Maybe } from '@toa.io/types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'

import type { Input } from './types'

export class List extends Directive {
  public readonly targeted = false

  private readonly options: Required<Options> = { meta: false }
  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor (permissions: Options | null, discovery: Promise<Component>) {
    super()
    schemas.list.validate(permissions)

    Object.assign(this.options, permissions)
    this.discovery = discovery
  }

  public async apply (storage: string, input: Input): Promise<Output> {
    this.storage ??= await this.discovery

    const metadata = input.subtype === 'octets.entries'

    if (metadata && !this.options.meta)
      throw new Forbidden('Metadata is not accessible.')

    const list = await this.storage.invoke<Maybe<string[]>>('list', {
      input: {
        storage,
        path: input.request.url
      }
    })

    if (list instanceof Error)
      throw new NotFound()

    const body = metadata
      ? await this.expand(storage, input.request.url, list)
      : list

    return { body }
  }

  private async expand (storage: string, prefix: string, list: string[]):
  Promise<Array<Maybe<Entry>>> {
    const promises = list.map(async (id) => {
      const path = posix.join(prefix, id)

      const input = {
        storage,
        path
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- ensured in `apply`
      return this.storage!.invoke<Maybe<Entry>>('get', { input })
    })

    return await Promise.all(promises)
  }
}

export interface Options {
  meta?: boolean
}
