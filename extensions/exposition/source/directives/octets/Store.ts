import type { Component } from '@toa.io/core'
import type { Output } from '../../Directive'
import type { Directive, Input } from './types'

export class Store implements Directive {
  private readonly discovery: Promise<Component>
  private storage: Component | null = null

  public constructor (_: any, discovery: Promise<Component>) {
    this.discovery = discovery
  }

  public async apply (storage: string, request: Input): Promise<Output> {
    this.storage ??= await this.discovery

    const input = { storage, request }
    const entry = await this.storage.invoke('store', { input })

    return { body: entry }
  }
}
