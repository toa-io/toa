import { Readable } from 'node:stream'
import { posix } from 'node:path'
import { match } from 'matchacho'
import { promex } from '@toa.io/generic'
import { BadRequest, UnsupportedMediaType } from '../../HTTP'
import { cors } from '../cors'
import * as schemas from './schemas'
import type { Maybe } from '@toa.io/types'
import type { Entry } from '@toa.io/extensions.storages'
import type { Remotes } from '../../Remotes'
import type { ErrorType } from 'error-value'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Directive, Input } from './types'

export class Store implements Directive {
  public readonly targeted = false

  private readonly accept: string | undefined
  private readonly workflow: Workflow | undefined
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

    this.workflow = match(options?.workflow,
      Array, (units: Unit[]) => units,
      Object, (unit: Unit) => [unit],
      undefined)

    this.discovery.storage = discovery
    this.remotes = remotes

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
      : Readable.from(this.execute(request, storage, entry))

    return { body }
  }

  private throw (error: ErrorType): never {
    throw match(error.code,
      'NOT_ACCEPTABLE', () => new UnsupportedMediaType(),
      'TYPE_MISMATCH', () => new BadRequest(),
      error)
  }

  /* eslint-disable no-useless-return, max-depth */

  /**
   * Execute workflow units sequentially, steps within a unit in parallel.
   * Yield results as soon as they come.
   *
   * If you need to change this, it may take a while.
   */
  private async * execute (request: Input, storage: string, entry: Entry): AsyncGenerator {
    yield entry

    const path = posix.join(request.path, entry.id)
    let interrupted = false

    for (const unit of this.workflow!) {
      if (interrupted)
        break

      const steps = Object.keys(unit)

      // unit result promises queue
      const results = Array.from(steps, promex<unknown>)
      let next = 0

      // execute steps in parallel
      for (const step of steps)
        // these promises are indirectly awaited in the yield loop
        void (async () => {
          const endpoint = unit[step]
          const context: Context = { storage, path, entry }
          const result = await this.call(endpoint, context)

          if (interrupted)
            return

          // as a result is received, resolve the next promise from the queue
          const promise = results[next++]

          if (result instanceof Error) {
            interrupted = true
            promise.resolve({ error: { step, ...result } })

            // cancel pending promises
            results[next].resolve(null)
          } else
            promise.resolve({ [step]: result ?? null })
        })().catch((e) => results[next].reject(e))

      // yield results from the queue as they come
      for (const promise of results) {
        const result = await promise

        if (result === null) // canceled promise
          break
        else
          yield result
      }
    }
  }

  private async call (endpoint: string, context: Context): Promise<Maybe<unknown>> {
    const [operation, component, namespace = 'default'] = endpoint.split('.').reverse()
    const key = `${namespace}.${component}`

    this.components[key] ??= await this.discover(key, namespace, component)

    return await this.components[key].invoke(operation, { input: context })
  }

  private async discover (key: string, namespace: string, component: string): Promise<Component> {
    if (this.discovery[key] === undefined)
      this.discovery[key] = this.remotes.discover(namespace, component)

    return await this.discovery[key]
  }

  private parseMeta (value: string | string[]): Record<string, string> {
    if (Array.isArray(value))
      value = value.join(',')

    const meta: Record<string, string> = {}

    for (const pair of value.split(',')) {
      const [k, v] = pair.trim().split('=')
      const key = k.trim()
      const value = v?.trim() ?? 'true'

      meta[key] = value
    }

    return meta
  }
}

type Unit = Record<string, string>
type Workflow = Unit[]

export interface Options {
  accept: string | string[]
  workflow: Workflow | Unit
}

interface Context {
  storage: string
  path: string
  entry: Entry
}

interface StoreInput {
  storage: string
  request: Input
  accept?: string
  meta?: Record<string, string>
}
