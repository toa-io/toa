import assert from 'node:assert'
import { match } from 'matchacho'
import * as http from '../../HTTP'
import { Anonymous } from './Anonymous'
import { Id } from './Id'
import { Role } from './Role'
import { Rule } from './Rule'
import { Incept } from './Incept'
import { Echo } from './Echo'
import { split } from './split'
import { Scheme } from './Scheme'
import { PRIMARY, PROVIDERS } from './schemes'
import type { Component } from '@toa.io/core'
import type { Remotes } from '../../Remotes'
import type { Family, Output } from '../../Directive'
import type { Parameter } from '../../RTD'
import type {
  AuthenticationResult,
  Ban,
  Directive,
  Discovery,
  Extension,
  Identity,
  Input,
  Remote,
  Schemes
} from './types'

class Authorization implements Family<Directive, Extension> {
  public readonly depends: string[] = ['Vary']
  public readonly name: string = 'auth'
  public readonly mandatory: boolean = true

  private readonly schemes = {} as unknown as Schemes
  private readonly discovery = {} as unknown as Discovery
  private tokens: Component | null = null
  private bans: Component | null = null

  public create (name: string, value: any, remotes: Remotes): Directive {
    assert.ok(name in CLASSES,
      `Directive '${name}' is not provided by the '${this.name}' family.`)

    const Class = CLASSES[name]

    for (const name of REMOTES) this.discovery[name] ??= remotes.discover('identity', name)

    return match(Class,
      Role,
      () => new Role(value, this.discovery.roles),
      Rule,
      () => new Rule(value, this.create.bind(this)),
      Incept,
      () => new Incept(value, this.discovery),
      () => new Class(value))
  }

  public async preflight (directives: Directive[],
    input: Input,
    parameters: Parameter[]): Promise<Output> {
    const identity = await this.resolve(input.headers.authorization)

    input.identity = identity

    for (const directive of directives) {
      const allow = await directive.authorize(identity, input, parameters)

      if (allow) return directive.reply?.(identity) ?? null
    }

    if (identity === null) throw new http.Unauthorized()
    else throw new http.Forbidden()
  }

  public async settle (directives: Directive[],
    request: Input,
    response: http.OutgoingMessage): Promise<void> {
    for (const directive of directives) await directive.settle?.(request, response)

    const identity = request.identity

    if (identity === null) return

    if (identity.scheme === PRIMARY && !identity.refresh) return

    // Role directive may have already set the value
    if (identity.roles === undefined) await Role.set(identity, this.discovery.roles)

    this.tokens ??= await this.discovery.tokens

    const token = await this.tokens.invoke<string>('encrypt', { input: { identity } })
    const authorization = `Token ${token}`

    if (response.headers === undefined) response.headers = new Headers()

    response.headers.set('authorization', authorization)
  }

  private async resolve (authorization: string | undefined): Promise<Identity | null> {
    if (authorization === undefined) return null

    const [scheme, credentials] = split(authorization)
    const provider = PROVIDERS[scheme]

    if (!(provider in this.discovery))
      throw new http.Unauthorized(`Unknown authentication scheme '${scheme}'.`)

    this.schemes[scheme] ??= await this.discovery[provider]

    const result = await this.schemes[scheme].invoke<AuthenticationResult>('authenticate', {
      input: credentials
    })

    if (result instanceof Error) return null

    const identity = result.identity

    if (scheme !== PRIMARY && (await this.banned(identity))) throw new http.Unauthorized()

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

const REMOTES: Remote[] = ['basic', 'federation', 'tokens', 'roles', 'bans']

export = new Authorization()
