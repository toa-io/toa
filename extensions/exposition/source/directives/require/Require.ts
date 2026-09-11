import { Headers } from './Headers.ts'
import type { Input } from '../../io.ts'
import type { Directive } from './Directive.ts'
import type { DirectiveFamily } from '../../RTD/index.ts'

export class Require implements DirectiveFamily {
  public readonly name = 'require'
  public readonly mandatory = false

  public create(name: string, value: unknown): Directive {
    if (!(name in directives)) throw new Error(`Unknown directive: require:${name}`)

    return new directives[name](value)
  }

  public precall(instances: Directive[], context: Input): null {
    for (const instance of instances) instance.precall(context)

    return null
  }
}

const directives: Record<string, new (value: any) => Directive> = {
  header: Headers,
  headers: Headers
}
