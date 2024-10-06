import assert from 'node:assert'
import { Mapping } from './Mapping'
import type { Component } from '@toa.io/core'
import type { Remotes } from '../../Remotes'
import type { Input } from '../../io'

export class Claims extends Mapping<Record<string, string>> {
  private readonly discovery!: Promise<Component>
  private federation: Component | null = null

  public constructor (map: Record<string, string>, remotes: Remotes) {
    assert.ok(map.constructor === Object, '`map:claims` must be an object')

    assert.ok(Object.values(map).every((value) => typeof value === 'string'),
      '`map:claims ` must be an object with string values')

    super(map, remotes)

    this.discovery = remotes.discover('identity', 'federation')
  }

  public override async properties (context: Input): Promise<Record<string, string> | null> {
    const authentication = context.request.headers.authorization

    if (authentication === undefined)
      return null

    const claims = await this.claims(authentication)

    if (claims === null)
      return null

    return Object.entries(this.value).reduce((properties: Record<string, string>, [property, claim]) => {
      const value = claims[claim]

      if (value !== undefined)
        properties[property] = value

      return properties
    }, {})
  }

  private async claims (authentication: string): Promise<Record<string, string> | null> {
    const [scheme, credentials] = authentication.split(' ')

    if (scheme !== 'Bearer' || credentials === undefined)
      return null

    this.federation ??= await this.discovery

    const claims = await this.federation.invoke<Record<string, string> | Error>('decode', { input: credentials })

    if (claims instanceof Error)
      return null

    return claims
  }
}
