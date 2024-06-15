import assert from 'node:assert'
import type { Directive, Identity, Input } from './types'
import type { Parameter } from '../../RTD'

export class Federation implements Directive {
  private readonly matchers: Array<[keyof Claim, Matcher]>

  public constructor (requirements: Options) {
    this.matchers = (Object.entries(requirements) as Array<[keyof Claim, string]>)
      .map(([key, value]) => [key, toMatcher(value)])

    assert.ok(this.matchers.length > 0, 'auth:claim requires at least one property defined')
  }

  public authorize (identity: Identity | null, context: Input, parameters: Parameter[]): boolean {
    if (identity === null || !('claim' in identity))
      return false

    const claim = (identity as FederatedIdentity).claim

    for (const [key, match] of this.matchers)
      if (!match(claim[key], context, parameters))
        return false

    return true
  }
}

function toMatcher (declaration: string): Matcher {
  if (declaration.startsWith(':')) {
    const property = declaration.slice(1) as 'authority'

    assert.ok(SPECIAL_CASES.includes(property),
      `Unknown syntax: ${declaration}`)

    return (value, context) => value === context[property]
  }

  if (declaration.startsWith('/:')) {
    const name = declaration.slice(2)

    return (value, _, parameters) => parameters
      .some((parameter) => parameter.name === name && parameter.value === value)
  }

  return (value) => value === declaration
}

const SPECIAL_CASES = ['authority']

type Matcher = (value: string, context: Input, parameters: Parameter[]) => boolean

interface Claim {
  iss: string
  sub: string
  aud: string
}

interface Options extends Partial<Claim> {
  iss: string
}

interface FederatedIdentity extends Identity {
  claim: Claim
}
