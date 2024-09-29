import assert from 'node:assert'
import { Mapping } from './Mapping'
import type { Input } from '../../io'

export class Claims extends Mapping<Record<string, string>> {
  public constructor (map: Record<string, string>) {
    assert.ok(map.constructor === Object, '`map:claims` must be an object')

    assert.ok(Object.values(map).every((value) => typeof value === 'string'),
      '`map:claims ` must be an object with string values')

    super(map)
  }

  public override properties (context: Input): Record<string, string> | null {
    const authenticated = context as unknown as Authenticated
    const claims = authenticated.identity?.claims

    if (claims === undefined)
      return null

    return Object.entries(this.value).reduce((properties: Record<string, string>, [property, claim]) => {
      const value = claims[claim]

      if (value !== undefined)
        properties[property] = value

      return properties
    }, {})
  }
}

interface Authenticated {
  identity: {
    claims?: Record<string, string | undefined>
  } | null
}
