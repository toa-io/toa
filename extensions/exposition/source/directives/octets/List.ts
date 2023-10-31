import { NotFound } from '../../HTTP'
import type { Maybe } from '@toa.io/types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../Directive'

import type { Directive, Input } from './types'

export class List implements Directive {
  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor (_: any, discovery: Promise<Component>) {
    this.discovery = discovery
  }

  public async apply (storage: string, request: Input): Promise<Output> {
    this.storage ??= await this.discovery

    const input = { storage, path: request.path }
    const list = await this.storage.invoke<Maybe<unknown>>('list', { input })

    if (list instanceof Error)
      throw new NotFound()

    return { body: list }
  }
}
