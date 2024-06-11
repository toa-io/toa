import { Readable } from 'node:stream'
import assert from 'node:assert'
import { match } from 'matchacho'
import { NotFound } from '../../HTTP'
import type { Directive } from './types'
import type { ReadableStream } from 'node:stream/web'
import type { Remotes } from '../../Remotes'
import type { Maybe } from '@toa.io/types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Input } from '../octets/types'
import type { Parameter } from '../../RTD'

export class Redirect implements Directive {
  public readonly targeted = true

  private readonly connecting: Promise<Component>
  private remote: Component | null = null
  private readonly operation: string

  public constructor (endpoint: string, discovery: Remotes) {
    assert.equal(typeof endpoint, 'string', '`flow:redirect` must be a string')

    const [operation, name, namespace = 'default'] = endpoint.split('.').reverse()

    this.operation = operation
    this.connecting = discovery.discover(namespace, name)
  }

  public async apply (input: Input, parameters: Parameter[]): Promise<Output> {
    if ('if-none-match' in input.request.headers)
      return { status: 304 }

    this.remote ??= await this.connecting

    const request = await this.remote.invoke<Maybe<Request | string>>(this.operation, {
      input: {
        authority: input.authority,
        path: input.request.url,
        parameters: Object.fromEntries(parameters.map(({ name, value }) => [name, value]))
      }
    })

    if (request instanceof Error)
      throw new NotFound(request)

    const { url, options } = match<Request>(request,
      String, { url: request },
      (request: Request): Request => ({
        url: request.url,
        options: {
          method: request.options?.method ?? 'GET',
          body: request.options?.body,
          headers: request.options?.headers
        }
      }))

    const response = await fetch(url, options)

    if (!response.ok)
      throw new NotFound()

    const headers = new Headers()

    for (const header of ['content-type', 'content-length', 'etag']) {
      const value = response.headers.get(header)

      if (value !== null)
        headers.set(header, value)
    }

    return {
      headers,
      body: response.body === null ? null : Readable.fromWeb(response.body as ReadableStream)
    }
  }
}

interface Request {
  url: string
  options?: RequestOptions
}

interface RequestOptions {
  method?: string
  body?: string
  headers?: Record<string, string>
}
