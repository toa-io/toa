import { Output } from './Output'
import { Input } from './Input'
import { Throttle } from './Throttle'
import type * as http from '../../HTTP'
import type { Constructor, Directive } from './Directive'
import type { DirectiveFamily } from '../../RTD'

export class IO implements DirectiveFamily<Directive> {
  public readonly name = 'io'
  public readonly mandatory = true

  public create (name: string, value: unknown): Directive {
    if (!(name in constructors))
      throw new Error(`Directive 'io:${name}' is not implemented`)

    const Directive = constructors[name]

    Directive.validate(value)

    return new Directive(value)
  }

  public preflight (directives: Directive[], context: http.Context): null {
    let restricted = false

    for (const directive of directives) {
      restricted ||= directive instanceof Output

      directive.preflight(context)
    }

    if (!restricted)
      DENIAL.preflight(context)

    return null
  }

  public async settle (directives: Directive[], context: http.Context, output: http.OutgoingMessage): Promise<void> {
    for (const directive of directives)
      await directive.settle?.(context, output)
  }

  public dispose (directives: Directive[]): void {
    for (const directive of directives)
      directive.dispose?.()
  }
}

const constructors: Record<string, Constructor> = {
  input: Input,
  output: Output,
  throttle: Throttle
}

const DENIAL: Output = new Output([])
