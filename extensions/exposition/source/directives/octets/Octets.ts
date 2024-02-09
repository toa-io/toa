import { NotFound } from '../../HTTP'
import { Context } from './Context'
import { Store } from './Store'
import { Fetch } from './Fetch'
import { List } from './List'
import { Delete } from './Delete'
import { Permute } from './Permute'
import type { Output } from '../../io'
import type { Component } from '@toa.io/core'
import type { Remotes } from '../../Remotes'
import type { Family } from '../../Directive'
import type { Directive, Input } from './types'

export class Octets implements Family<Directive> {
  public readonly name: string = 'octets'
  public readonly mandatory: boolean = false

  private discovery = null as unknown as Promise<Component>

  public create (name: string, value: any, remotes: Remotes): Directive {
    const Class = DIRECTIVES[name]

    if (Class === undefined)
      throw new Error(`Directive '${name}' is not provided by the '${this.name}' family.`)

    this.discovery ??= remotes.discover('octets', 'storage')

    return new Class(value, this.discovery, remotes)
  }

  public async preflight (directives: Directive[], input: Input): Promise<Output> {
    let context: Context | null = null
    let action: Directive | null = null

    for (const directive of directives)
      if (directive instanceof Context)
        context ??= directive
      else if (action === null)
        action = directive
      else
        throw new Error('Octets action is umbiguous.')

    if (action === null)
      return null

    if (context === null)
      throw new Error('Octets context is not defined.')

    const targeted = input.path[input.path.length - 1] !== '/'

    if (targeted !== action.targeted)
      throw new NotFound(`Trailing slash is ${action.targeted ? 'redundant' : 'required'}.`)

    return await action.apply(context.storage, input)
  }
}

const DIRECTIVES: Record<string, Constructor> = {
  context: Context,
  store: Store,
  fetch: Fetch,
  list: List,
  delete: Delete,
  permute: Permute
}

type Constructor = new (value: any, discovery: Promise<Component>, remotes: Remotes) => Directive
