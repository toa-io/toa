import { type Component } from '@toa.io/core'
import { type Parameter } from '../../RTD'
import { type Family, type Input, type Output } from '../../Directive'
import { type Remotes } from '../../Remotes'
import * as http from '../../HTTP'
import { type Directive, type Identity } from './types'
import { Id } from './Id'

class Authorization implements Family<Directive> {
  public readonly name: string = 'auth'
  private readonly schemes: Record<string, Component> = {}
  private discovery: Record<string, Promise<Component>> = {}

  public create (name: string, value: any, remotes: Remotes): Directive {
    const Class = constructors[name]

    if (Class === undefined)
      throw new Error(`Directive '${name}' is not provided by '${this.name}'.`)

    this.discovery = {
      basic: remotes.discover('identity', 'basic')
    }

    return new Class(value)
  }

  public async apply (directives: Directive[],
    input: Input,
    parameters: Parameter[]): Promise<Output> {
    const identity = await this.resovle(input.headers.authorization)

    for (const directive of directives) {
      const allow = directive.apply(identity, parameters)

      if (allow)
        return null
    }

    if (identity === null) throw new http.Unauthorized()
    else throw new http.Forbidden()
  }

  private async resovle (authorization: string | undefined): Promise<Identity | null> {
    if (authorization === undefined)
      return null

    const space = authorization.indexOf(' ')
    const scheme = authorization.slice(0, space).toLowerCase()
    const value = authorization.slice(space + 1)

    if (!(scheme in this.discovery))
      throw new http.Unauthorized(`Unknown authentication scheme '${scheme}'.`)

    this.schemes[scheme] ??= await this.discovery[scheme]

    const reply = await this.schemes[scheme].invoke('resolve', { input: value })

    if (reply.error !== undefined) return null
    else return reply.output
  }
}

const constructors: Record<string, new (value: any) => Directive> = {
  id: Id
}

export = new Authorization()
