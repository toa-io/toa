import { PassThrough } from 'node:stream'
import { match } from 'matchacho'
import * as http from '../../HTTP'
import { cors } from '../cors'
import * as schemas from './schemas'
import { Workflow } from './workflows'
import { Directive } from './Directive'
import { toBytes } from './bytes'
import type { Readable } from 'stream'
import type { Parameter } from '../../RTD'
import type { Unit } from './workflows'
import type { Entry } from '@toa.io/extensions.storages'
import type { Remotes } from '../../Remotes'
import type { ErrorType } from 'error-value'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Input } from './types'

export class Put extends Directive {
  public readonly targeted = false

  private readonly accept?: string
  private readonly limit: number
  private readonly limitString: string
  private readonly trust?: Array<string | RegExp>
  private readonly workflow?: Workflow
  private readonly discovery: Record<string, Promise<Component>> = {}
  private storage: Component | null = null

  public constructor
  (options: Options | null, discovery: Promise<Component>, remotes: Remotes) {
    super()

    schemas.put.validate<Options>(options)

    this.accept = match(options?.accept,
      String, (value: string) => value,
      Array, (types: string[]) => types.join(','),
      undefined)

    if (options?.workflow !== undefined)
      this.workflow = new Workflow(options.workflow, remotes)

    if (options?.trust !== undefined)
      this.trust = options.trust.map((value: string) =>
        value.startsWith('/') ? new RegExp(value.slice(1, -1)) : value)

    this.limitString = options?.limit ?? '64MiB'
    this.limit = toBytes(this.limitString)
    this.discovery.storage = discovery

    cors.allow('content-attributes')
    cors.allow('content-location')
  }

  public async apply (storage: string, input: Input, parameters: Parameter[]): Promise<Output> {
    this.storage ??= await this.discovery.storage

    const request: StoreRequest = {
      input: {
        storage,
        request: input.request,
        accept: this.accept,
        limit: this.limit,
        trust: this.trust
      }
    }

    const entry = await this.storage.invoke<Entry>('put', request)

    return match<Output>(entry,
      Error, (error: ErrorType) => this.throw(error),
      () => this.reply(input, storage, entry, parameters))
  }

  // eslint-disable-next-line max-params
  private reply (input: Input, storage: string, entry: Entry, parameters: Parameter[]): Output {
    const body = this.workflow === undefined
      ? entry
      : this.execute(input, storage, entry, parameters)

    return { body }
  }

  // eslint-disable-next-line max-params
  private execute
  (input: Input, storage: string, entry: Entry, parameters: Parameter[]): Readable {
    const stream = new PassThrough({ objectMode: true })

    stream.push(entry)

    this.workflow!.execute(input, storage, entry, parameters).pipe(stream)

    return stream
  }

  private throw (error: ErrorType): never {
    throw match(error.code,
      'NOT_ACCEPTABLE', () => new http.UnsupportedMediaType(),
      'TYPE_MISMATCH', () => new http.BadRequest(),
      'LIMIT_EXCEEDED', () => new http.RequestEntityTooLarge(`Size limit is ${this.limitString}`),
      'LOCATION_UNTRUSTED', () => new http.Forbidden(error.message),
      'LOCATION_LENGTH', () => new http.BadRequest(error.message),
      'LOCATION_UNAVAILABLE', () => new http.NotFound(error.message),
      error)
  }

  private attributes (value: string | string[]): Record<string, string> {
    if (Array.isArray(value))
      value = value.join(',')

    const attributes: Record<string, string> = {}

    for (const pair of value.split(',')) {
      const eq = pair.indexOf('=')
      const key = (eq === -1 ? pair : pair.slice(0, eq)).trim()

      attributes[key] = eq === -1 ? 'true' : pair.slice(eq + 1).trim()
    }

    return attributes
  }
}

export interface Options {
  accept?: string | string[]
  limit?: string
  workflow?: Unit[] | Unit
  trust?: string[]
}

interface StoreRequest {
  input: {
    storage: string
    request: Input['request']
    accept?: string
    limit?: number
    trust?: Array<string | RegExp>
    attributes?: Record<string, string>
  }
}
