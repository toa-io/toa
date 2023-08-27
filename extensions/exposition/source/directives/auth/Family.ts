import { type Component } from '@toa.io/core'
import { type Parameter } from '../../RTD'
import { type Family, type Input, type Output } from '../../Directive'
import { type Remotes } from '../../Remotes'
import * as http from '../../HTTP'
import { type Directive, type Identity } from './types'
import { Anonymous } from './Anonymous'
import { Id } from './Id'
import { Role } from './Role'

class Authorization implements Family<Directive> {
  public readonly name: string = 'auth'
  public readonly mandatory: boolean = true
  private readonly schemes: Record<string, Component> = {}
  private readonly discovery: Record<string, Promise<Component>> = {}
  private roles: Promise<Component> | null = null

  public create (name: string, value: any, remotes: Remotes): Directive {
    const Class = constructors[name]

    if (Class === undefined)
      throw new Error(`Directive '${name}' is not provided by '${this.name}'.`)

    this.discovery.basic ??= remotes.discover('identity', 'basic')
    this.roles ??= remotes.discover('identity', 'roles')

    if (Class === Role) return new Class(value, this.roles)
    else return new Class(value)
  }

  public async preflight (directives: Directive[],
    input: Input,
    parameters: Parameter[]): Promise<Output> {
    const identity = await this.resolve(input.headers.authorization)

    for (const directive of directives) {
      const allow = await directive.authorize(identity, parameters)

      if (allow)
        return null
    }

    if (identity === null) throw new http.Unauthorized()
    else throw new http.Forbidden()
  }

  private async resolve (authorization: string | undefined): Promise<Identity | null> {
    if (authorization === undefined)
      return null

    const space = authorization.indexOf(' ')

    if (space === -1)
      throw new http.Unauthorized('Malformed authorization header.')

    const Scheme = authorization.slice(0, space)
    const scheme = Scheme.toLowerCase()
    const value = authorization.slice(space + 1)

    if (!(scheme in this.discovery))
      throw new http.Unauthorized(`Unknown authentication scheme '${Scheme}'.`)

    this.schemes[scheme] ??= await this.discovery[scheme]

    const reply = await this.schemes[scheme].invoke('authenticate', { input: value })

    if (reply.error !== undefined) return null
    else return reply.output
  }
}

const constructors: Record<string, new (value: any, argument?: any) => Directive> = {
  anonymous: Anonymous,
  id: Id,
  role: Role
}

export = new Authorization()
