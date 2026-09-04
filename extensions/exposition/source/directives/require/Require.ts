import assert from 'node:assert'
import { Headers } from './Headers.js'
import type { Input } from '../../io.js'
import type { Directive } from './Directive.js'
import type { DirectiveFamily } from '../../RTD/index.js'

export class Require implements DirectiveFamily {
  public readonly name = 'require'
  public readonly mandatory = false

  public create (name: string, value: unknown): Directive {
    assert.ok(name in directives, `Unknown directive: require:${name}`)

    return new directives[name](value)
  }

  public precall (instances: Directive[], context: Input): null {
    for (const instance of instances)
      instance.precall(context)

    return null
  }
}

const directives: Record<string, new (value: any) => Directive> = {
  header: Headers,
  headers: Headers
}
