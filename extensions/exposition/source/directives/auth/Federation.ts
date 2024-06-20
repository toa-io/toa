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
    const key = expression.slice(1) as 'authority'

    if (key === 'authority')
      return (value, context) => matches(value, context[key])

    if (key === 'domain')
      return (value, context) => {
        return Array.isArray(value)
          ? value.some((iss) => codomain(iss, context))
          : codomain(value, context)
      }

    throw new Error(`Unknown 'auth:claim' syntax: ${expression}`)
  }

  if (expression.startsWith('/:')) {
    const name = expression.slice(2)

    return (value, _, parameters) => parameters
      .some((parameter) => parameter.name === name && matches(value, parameter.value))
  }

  return (value) => matches(value, expression)
}

function matches (value: string | string[], reference: string): boolean {
  return Array.isArray(value)
    ? value.includes(reference)
    : value === reference
}

function codomain (iss: string, context: Input): boolean {
  const hostname = new URL(iss).hostname
  const dot = hostname.indexOf('.')
  const basename = dot === -1 ? hostname : hostname.slice(dot)

  return context.authority.slice(-basename.length) === basename
}

type Matcher = (value: string | string[], context: Input, parameters: Parameter[]) => boolean

interface Claim {
  iss: string
  sub: string
  aud: string | string[]
}

interface Options extends Partial<Claim> {
  iss: string
}

interface FederatedIdentity extends Identity {
  claim: Claim
}
