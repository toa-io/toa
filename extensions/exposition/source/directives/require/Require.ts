import assert from 'node:assert'
import { Headers } from './Headers'
import type { Input } from '../../io'
import type { Directive } from './Directive'
import type { DirectiveFamily } from '../../RTD'

export class Require implements DirectiveFamily {
  public readonly name = 'require'
  public readonly mandatory = false

  public create (name: string, value: unknown): Directive {
    assert.ok(name in directives, `Unknown directive: require:${name}`)

    return new directives[name](value)
  }

  public preflight (instances: Directive[], context: Input): null {
    for (const instance of instances)
      instance.preflight(context)

    return null
  }
}

const directives: Record<string, new (value: any) => Directive> = {
  header: Headers,
  headers: Headers
}
