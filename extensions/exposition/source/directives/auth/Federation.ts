import assert from 'node:assert'
import type { Directive, Identity, Input } from './types'
import type { Parameter } from '../../RTD'

export class Federation implements Directive {
  private readonly matchers: Array<[keyof Claim, Matcher]>

  public constructor (options: Options) {
    this.matchers = (Object.entries(options) as Array<[keyof Claim, string]>)
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

function toMatcher (expression: string): Matcher {
  if (expression.startsWith(':')) {
    const fn = expression.slice(1) as 'authority'

    if (fn === 'authority')
      return (value, context) => value === context[fn]

    if (fn === 'domain')
      return (iss, context) => {
        const hostname = new URL(iss).hostname
        const dot = hostname.indexOf('.')
        const basename = dot === -1 ? hostname : hostname.slice(dot)

        return context.authority.slice(-basename.length) === basename
      }

    throw new Error(`Unknown 'auth:claim' syntax: ${expression}`)
  }

  if (expression.startsWith('/:')) {
    const name = expression.slice(2)

    return (value, _, parameters) => parameters
      .some((parameter) => parameter.name === name && parameter.value === value)
  }

  return (value) => value === expression
}

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
