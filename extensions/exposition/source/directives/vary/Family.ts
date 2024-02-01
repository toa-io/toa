import assert from 'node:assert'
import { type Input, type Output, type Family } from '../../Directive'
import { Stub } from './Stub'
import { type Directive } from './types'

class Development implements Family<Directive> {
  public readonly name: string = 'vary'
  public readonly mandatory: boolean = false

  public create (name: string, value: any): Directive {
    assert.ok(name in constructors,
      `Directive '${name}' is not provided by the '${this.name}' family.`)

    return new constructors[name](value)
  }

  public preflight (directives: Directive[], input: Input): Output {
    return null
  }
}

const constructors: Record<string, new (value: any) => Directive> = {
  stub: Stub
}

export = new Development()
