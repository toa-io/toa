import { match } from 'matchacho'
import { BadRequest, UnsupportedMediaType } from '../../HTTP'
import { cors } from '../cors'
import * as schemas from './schemas'
import { Workflow } from './workflow'
import type { Unit } from './workflow'
import type { Entry } from '@toa.io/extensions.storages'
import type { Remotes } from '../../Remotes'
import type { ErrorType } from 'error-value'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Directive, Input } from './types'

export class Store implements Directive {
  public readonly targeted = false

  private readonly accept?: string
  private readonly workflow?: Workflow
  private readonly discovery: Record<string, Promise<Component>> = {}
  private readonly remotes: Remotes
  private readonly components: Record<string, Component> = {}
  private storage: Component | null = null

  public constructor
  (options: Options | null, discovery: Promise<Component>, remotes: Remotes) {
    schemas.store.validate(options)

    this.accept = match(options?.accept,
      String, (value: string) => value,
      Array, (types: string[]) => types.join(','),
      undefined)

    if (options?.workflow !== undefined)
      this.workflow = new Workflow(options.workflow, remotes)

    this.discovery.storage = discovery

    cors.allowHeader('content-meta')
  }

  public async apply (storage: string, request: Input): Promise<Output> {
    this.storage ??= await this.discovery.storage

    const input: StoreInput = { storage, request }
    const meta = request.headers['content-meta']

    if (this.accept !== undefined)
      input.accept = this.accept

    if (meta !== undefined)
      input.meta = this.parseMeta(meta)

    const entry = await this.storage.invoke<Entry>('store', { input })

    return match<Output>(entry,
      Error, (error: ErrorType) => this.throw(error),
      () => this.reply(request, storage, entry))
  }

  private reply (request: Input, storage: string, entry: Entry): Output {
    const body = this.workflow === undefined
      ? entry
      : this.workflow.execute(request, storage, entry)

    return { body }
  }

  private throw (error: ErrorType): never {
    throw match(error.code,
      'NOT_ACCEPTABLE', () => new UnsupportedMediaType(),
      'TYPE_MISMATCH', () => new BadRequest(),
      error)
  }

  private parseMeta (value: string | string[]): Record<string, string> {
    if (Array.isArray(value))
      value = value.join(',')

    const meta: Record<string, string> = {}

    for (const pair of value.split(',')) {
      const eq = pair.indexOf('=')
      const key = (eq === -1 ? pair : pair.slice(0, eq)).trim()

      meta[key] = eq === -1 ? 'true' : pair.slice(eq + 1).trim()
    }

    return meta
  }
}

export interface Options {
  accept: string | string[]
  workflow: Unit[] | Unit
}

interface StoreInput {
  storage: string
  request: Input
  accept?: string
  meta?: Record<string, string>
}
