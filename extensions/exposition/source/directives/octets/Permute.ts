import { NotAcceptable, NotFound } from '../../HTTP'
import * as schemas from './schemas'
import type { Maybe } from '@toa.io/types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'

import type { Directive, Input } from './types'

export class Permute implements Directive {
  public readonly targeted = false

  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor (value: null, discovery: Promise<Component>) {
    schemas.permute.validate(value)

    this.discovery = discovery
  }

  public async apply (storage: string, input: Input): Promise<Output> {
    this.storage ??= await this.discovery

    if (input.encoder === null)
      throw new NotAcceptable()

    const path = input.request.url
    const list = await input.body()

    const error = await this.storage.invoke<Maybe<unknown>>('permute', {
      input: {
        storage,
        path,
        list
      }
    })

    if (error instanceof Error)
      throw new NotFound()

    return {}
  }
}
