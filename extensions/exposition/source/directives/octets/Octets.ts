import { NotFound } from '../../HTTP'
import { Context } from './Context'
import { Put } from './Put'
import { Get } from './Get'
import { Delete } from './Delete'
import { WorkflowDirective } from './Workflow'
import type { Directive } from './Directive'
import type { Output } from '../../io'
import type { Component } from '@toa.io/core'
import type { Remotes } from '../../Remotes'
import type { Parameter, DirectiveFamily } from '../../RTD'
import type { Input } from './types'

export class Octets implements DirectiveFamily<Directive> {
  public readonly name: string = 'octets'
  public readonly mandatory: boolean = false

  private discovery = null as unknown as Promise<Component>

  public create (name: string, value: any, remotes: Remotes): Directive {
    const Class = DIRECTIVES[name]

    if (Class === undefined)
      throw new Error(`Directive 'octets:${name}' is not implemented`)

    this.discovery ??= remotes.discover('octets', 'storage')

    return new Class(value, this.discovery, remotes)
  }

  public async preflight
  (directives: Directive[], input: Input, parameters: Parameter[]): Promise<Output> {
    let context: Context | null = null
    let action: Directive | null = null

    for (const directive of directives)
      if (directive instanceof Context)
        context ??= directive
      else if (action === null)
        action = directive
      else
        throw new Error('Octets action is ambiguous')

    if (action === null)
      return null

    // noinspection PointlessBooleanExpressionJS
    if (context === null)
      throw new Error('Octets context is not defined')

    const targeted = input.request.url[input.request.url.length - 1] !== '/'

    if (targeted !== action.targeted)
      throw new NotFound(`Trailing slash is ${action.targeted ? 'redundant' : 'required'}`)

    // noinspection JSObjectNullOrUndefined
    return await input.timing.capture(action.name, action.apply(context.storage, input, parameters))
  }
}

const DIRECTIVES: Record<string, Constructor> = {
  context: Context,
  put: Put,
  get: Get,
  head: Get,
  delete: Delete,
  workflow: WorkflowDirective
}

type Constructor = new (value: any, discovery: Promise<Component>, remotes: Remotes) => Directive
