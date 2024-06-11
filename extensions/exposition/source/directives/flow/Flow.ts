import { Redirect } from './Redirect'
import type { Directive } from './types'
import type { Input, Output } from '../../io'
import type { DirectiveFamily, Parameter } from '../../RTD'
import type { Remotes } from '../../Remotes'

export class Flow implements DirectiveFamily<Directive> {
  public readonly name: string = 'flow'
  public readonly mandatory: boolean = false

  public create (name: string, value: unknown, remotes: Remotes): Directive {
    const Class = constructors[name]

    if (Class === undefined)
      throw new Error(`Directive '${this.name}:${name}' is not implemented.`)

    return new Class(value, remotes)
  }

  public async preflight (directives: Directive[], input: Input, parameters: Parameter[]): Promise<Output> {
    for (const directive of directives) {
      const output = await directive.apply(input, parameters)

      if (output !== null)
        return output
    }

    return null
  }
}

const constructors: Record<string, new (value: any, discovery: Remotes) => Directive> = {
  redirect: Redirect
}
