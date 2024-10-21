import assert from 'node:assert'
import type { Directive, Identity, Context } from './types'
import type { Parameter } from '../../RTD'

export class Federation implements Directive {
  private readonly matchers: Array<[keyof Claims, Matcher]>

  public constructor (options: Options) {
    this.matchers = (Object.entries(options) as Array<[keyof Claims, string]>)
      .map(([key, value]) => [key, toMatcher(value)])

    assert.ok(this.matchers.length > 0, '`auth:claims` requires at least one property defined')
  }

  public authorize (identity: Identity | null, context: Context, parameters: Parameter[]): boolean {
    if (identity === null || !('claims' in identity))
      return false

    const claims = (identity as FederatedIdentity).claims

    for (const [key, match] of this.matchers)
      if (!match(claims[key], context, parameters))
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

    throw new Error('Unknown `auth:claims` syntax: ' + expression)
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

function codomain (iss: string, context: Context): boolean {
  const hostname = new URL(iss).hostname
  const dot = hostname.indexOf('.')
  const basename = dot === -1 ? hostname : hostname.slice(dot)

  return context.authority.slice(-basename.length) === basename
}

type Matcher = (value: string | string[], context: Context, parameters: Parameter[]) => boolean

interface Claims {
  iss: string
  sub: string
  aud: string | string[]
}

interface Options extends Partial<Claims> {
  iss: string
}

interface FederatedIdentity extends Identity {
  claims: Claims
}
