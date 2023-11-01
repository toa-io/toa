import { match } from '@toa.io/match'
import { BadRequest, UnsupportedMediaType } from '../../HTTP'
import type { ErrorType } from 'error-value'
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
    const entry = await this.storage.invoke('store', { input })

    return match<Output>(entry,
      Error, (error: ErrorType) => this.throw(error, request),
      () => ({ body: entry }))
  }

  private throw (error: ErrorType, request: Input): never {
    throw match(error.code,
      'NOT_ACCEPTABLE', () => new UnsupportedMediaType(),
      'TYPE_MISMATCH', () => new BadRequest(),
      error)
  }
}

interface Properties {
  accept: string | string[]
}
