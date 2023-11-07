import { NotFound } from '../../HTTP'
import * as schemas from './schemas'
import type { Maybe } from '@toa.io/types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../Directive'

import type { Directive, Input } from './types'

export class Delete implements Directive {
  public readonly targeted = true

  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor (value: null, discovery: Promise<Component>) {
    schemas.remove.validate(value)

    this.discovery = discovery
  }

  public async apply (storage: string, request: Input): Promise<Output> {
    this.storage ??= await this.discovery

    const input = { storage, path: request.path }
    const error = await this.storage.invoke<Maybe<unknown>>('delete', { input })

    if (error instanceof Error)
      throw new NotFound()

    return {}
  }
}
