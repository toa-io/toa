import { Readable } from 'node:stream'
import assert from 'node:assert'
import { NotFound } from '../../HTTP'
import { Directive } from './Directive'
import type { Remotes } from '../../Remotes'
import type { Maybe } from '@toa.io/types'
import type { Component } from '@toa.io/core'
import type { Output } from '../../io'
import type { Input } from './types'
import type { Parameter } from '../../RTD'

export class Redirect extends Directive {
  public readonly targeted = true

  private readonly connecting: Promise<Component>
  private remote: Component | null = null
  private readonly operation: string

  public constructor (endpoint: string, _: unknown, discovery: Remotes) {
    super()

    assert.equal(typeof endpoint, 'string', '`octets:redirect` must be a string')

    const [operation, name, namespace = 'default'] = endpoint.split('.').reverse()

    this.operation = operation
    this.connecting = discovery.discover(namespace, name)
  }

  public async apply (_: string, input: Input, parameters: Parameter[]): Promise<Output> {
    if ('if-none-match' in input.request.headers)
      return { status: 304 }

    this.remote ??= await this.connecting

    const url = await this.remote.invoke<Maybe<string>>(this.operation, {
      input: {
        authority: input.authority,
        path: input.request.url,
        parameters: Object.fromEntries(parameters.map(({ name, value }) => [name, value]))
      }
    })

    if (url instanceof Error)
      throw new NotFound(url)

    const response = await fetch(url)

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
      body: response.body === null ? null : Readable.fromWeb(response.body as any)
    }
  }
}
