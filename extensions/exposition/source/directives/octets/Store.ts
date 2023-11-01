import { match } from '@toa.io/match'
import { BadRequest, UnsupportedMediaType } from '../../HTTP'
import type { Component } from '@toa.io/core'
import type { Output } from '../../Directive'
import type { Directive, Input } from './types'

export class Store implements Directive {
  public readonly targeted = false

  private readonly accept: string | undefined
  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor (properties: Properties | null, discovery: Promise<Component>) {
    if (properties !== null)
      this.accept = match(properties.accept,
        String, properties.accept,
        Array, (types: string[]) => types.join(','),
        undefined)

    this.discovery = discovery
  }

  public async apply (storage: string, request: Input): Promise<Output> {
    this.storage ??= await this.discovery

    const input = { storage, request, accept: this.accept }
    const entry = await this.storage.invoke<any>('store', { input })

    return match(entry,
      Error, (error: Error) => this.throw(error),
      () => ({ body: entry }))
  }

  private throw (error: Error): never {
    throw match<Error>(error.message,
      'NOT_ACCEPTABLE', () => new UnsupportedMediaType(),
      'TYPE_MISMATCH', () => new BadRequest(),
      error)
  }
}

interface Properties {
  accept: string | string[]
}
