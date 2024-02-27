import { Control } from './Control'
import { Exact } from './Exact'
import type { Input, Output } from '../../io'
import type { Directive } from './types'
import type { DirectiveFamily } from '../../RTD'
import type * as http from '../../HTTP'

export class Cache implements DirectiveFamily<Directive> {
  public readonly name: string = 'cache'
  public readonly mandatory: boolean = false

  public create (name: string, value: any): Directive {
    const Class = constructors[name]

    if (Class === undefined)
      throw new Error(`Directive '${name}' is not provided by the '${this.name}' family.`)

    return new Class(value)
  }

  public preflight (): Output {
    return null
  }

  public async settle
  (directives: Directive[], input: Input, response: http.OutgoingMessage): Promise<void> {
    response.headers ??= new Headers()
    directives[0]?.set(input, response.headers)
  }
}

const constructors: Record<string, new (value: any) => Directive> = {
  control: Control,
  exact: Exact
}
