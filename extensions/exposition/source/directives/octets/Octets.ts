import { NotFound } from '../../HTTP/index.ts'
import { Context } from './Context.ts'
import { Put } from './Put.ts'
import { Get } from './Get.ts'
import { Delete } from './Delete.ts'
import { WorkflowDirective } from './Workflow.ts'
import type { Directive } from './Directive.ts'
import type { Output } from '../../io.ts'
import type { Component } from '@toa.io/core'
import type { Remotes } from '../../Remotes.ts'
import type { Parameter, DirectiveFamily } from '../../RTD/index.ts'
import type { Introspection } from '../../Introspection.ts'
import type { Input } from './types.ts'

export class Octets implements DirectiveFamily<Directive> {
  public readonly name: string = 'octets'
  public readonly mandatory: boolean = false

  private discovery = null as unknown as Promise<Component>

  public create(name: string, value: any, remotes: Remotes): Directive {
    const Class = DIRECTIVES[name]

    if (Class === undefined)
      throw new Error(`Directive 'octets:${name}' is not implemented`)

    this.discovery ??= remotes.discover('exposition', 'octets')

    return new Class(value, this.discovery, remotes)
  }

  /** What the request takes, which only sending a file says anything about. */
  public explain(directives: Directive[], _: Input, introspection: Introspection): Introspection {
    for (const directive of directives) directive.describe?.(introspection)

    return introspection
  }

  public async precall(
    directives: Directive[],
    input: Input,
    parameters: Parameter[]
  ): Promise<Output> {
    let context: Context | null = null
    let action: Directive | null = null

    for (const directive of directives)
      if (directive instanceof Context) context ??= directive
      else if (action === null) action = directive
      else throw new Error('Octets action is ambiguous')

    if (action === null) return null

    // noinspection PointlessBooleanExpressionJS
    if (context === null) throw new Error('Octets context is not defined')

    const targeted = input.request.url[input.request.url.length - 1] !== '/'

    if (targeted !== action.targeted)
      throw new NotFound(
        `Trailing slash is ${action.targeted ? 'redundant' : 'required'}`
      )

    // noinspection JSObjectNullOrUndefined
    return await action.apply(context.storage, input, parameters)
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

type Constructor = new (
  value: any,
  discovery: Promise<Component>,
  remotes: Remotes
) => Directive
