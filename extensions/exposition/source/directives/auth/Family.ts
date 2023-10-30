import { type Component } from '@toa.io/core'
import { match } from '@toa.io/match'
import { type Parameter } from '../../RTD'
import { type Family, type Output } from '../../Directive'
import { type Remotes } from '../../Remotes'
import * as http from '../../HTTP'
import {
  type AuthenticationResult,
  type Ban,
  type Directive,
  type Discovery,
  type Extension,
  type Identity,
  type Input,
  type Remote,
  type Schemes
} from './types'
import { Anonymous } from './Anonymous'
import { Id } from './Id'
import { Role } from './Role'
import { Rule } from './Rule'
import { Incept } from './Incept'
import { split } from './split'
import { PRIMARY, PROVIDERS } from './schemes'
import { Scheme } from './Scheme'
import { Echo } from './Echo'

class Authorization implements Family<Directive, Extension> {
  public readonly name: string = 'auth'
  public readonly mandatory: boolean = true

  private readonly schemes = {} as unknown as Schemes
  private readonly discovery = {} as unknown as Discovery
  private tokens: Component | null = null
  private bans: Component | null = null

  public create (name: string, value: any, remotes: Remotes): Directive {
    const Class = CLASSES[name]

    if (Class === undefined)
      throw new Error(`Directive '${name}' is not provided by the '${this.name}' family.`)

    for (const name of REMOTES)
      this.discovery[name] ??= remotes.discover('identity', name)

    return match(Class,
      Role, () => new Class(value, this.discovery.roles),
      Rule, () => new Class(value, this.create.bind(this)),
      Incept, () => new Class(value, this.discovery),
      () => new Class(value))
  }

  public async preflight
  (directives: Directive[], input: Input, parameters: Parameter[]): Promise<Output> {
    const identity = await this.resolve(input.headers.authorization)

    input.identity = identity

    for (const directive of directives) {
      const allow = await directive.authorize(identity, input, parameters)

      if (allow)
        return directive.reply?.(identity) ?? null
    }

    if (identity === null) throw new http.Unauthorized()
    else throw new http.Forbidden()
  }

  public async settle
  (directives: Directive[], request: Input, response: http.OutgoingMessage): Promise<void> {
    for (const directive of directives)
      await directive.settle?.(request, response)

    const identity = request.identity

    if (identity === null)
      return

    if (identity.scheme === PRIMARY && !identity.refresh)
      return

    // Role directive may have already set the value
    if (identity.roles === undefined)
      await Role.set(identity, this.discovery.roles)

    this.tokens ??= await this.discovery.tokens

    const token = await this.tokens.invoke<string>('encrypt', { input: { identity } })
    const authorization = `Token ${token}`

    if (response.headers === undefined)
      response.headers = {}

    response.headers.authorization = authorization
  }

  private async resolve (authorization: string | undefined): Promise<Identity | null> {
    if (authorization === undefined)
      return null

    const [scheme, credentials] = split(authorization)
    const provider = PROVIDERS[scheme]

    if (!(provider in this.discovery))
      throw new http.Unauthorized(`Unknown authentication scheme '${scheme}'.`)

    this.schemes[scheme] ??= await this.discovery[provider]

    const result = await this.schemes[scheme]
      .invoke<AuthenticationResult>('authenticate', { input: credentials })

    if (result instanceof Error)
      return null

    const identity = result.identity

    if (scheme !== PRIMARY && await this.banned(identity))
      throw new http.Unauthorized()

    identity.scheme = scheme
    identity.refresh = result.refresh

    return identity
  }

  private async banned (identity: Identity): Promise<boolean> {
    this.bans ??= await this.discovery.bans

    const ban = await this.bans.invoke<Ban>('observe', { query: { id: identity.id } })

    return ban.banned
  }
}

const CLASSES: Record<string, new (value: any, argument?: any) => Directive> = {
  anonymous: Anonymous,
  id: Id,
  role: Role,
  rule: Rule,
  incept: Incept,
  scheme: Scheme,
  echo: Echo
}

const REMOTES: Remote[] = ['basic', 'tokens', 'roles', 'bans']

export = new Authorization()
