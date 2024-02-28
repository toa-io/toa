import { Output } from './Output'
import type { Constructor, Directive } from './Directive'
import type { Input as Context } from '../../io'
import type { DirectiveFamily } from '../../RTD'

export class IO implements DirectiveFamily<Directive> {
  public readonly name = 'io'
  public readonly mandatory = true
  private readonly denial: Output = new Output([])

  public create (name: string, value: unknown): Directive {
    if (!(name in constructors))
      throw new Error(`Directive 'io:${name}' is not implemented.`)

    const Directive = constructors[name]

    Directive.validate(value)

    return new Directive(value)
  }

  public preflight (directives: Directive[], context: Context): null {
    let restricted = false

    for (const directive of directives) {
      restricted ||= directive instanceof Output

      directive.attach(context)
    }

    if (!restricted)
      this.denial.attach(context)

    return null
  }
}

const constructors: Record<string, Constructor> = {
  output: Output
}
