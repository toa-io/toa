import { Stub } from './Stub.ts'
import { Throw } from './Throw.ts'
import { Sleep } from './Sleep.ts'
import { Faulty } from './Faulty.ts'
import { type Directive } from './types.ts'
import type { Input, Output } from '../../io.ts'
import type { DirectiveFamily } from '../../RTD/index.ts'

export class Development implements DirectiveFamily<Directive> {
  public readonly name: string = 'dev'
  public readonly mandatory: boolean = false

  public create(name: string, value: unknown): Directive {
    const Class = constructors[name]

    if (Class === undefined) throw new Error(`Directive 'dev:${name}' is not implemented`)

    return new Class(value)
  }

  public async precall(directives: Directive[], input: Input): Promise<Output> {
    let output = null

    for (const directive of directives) {
      const out = await directive.apply(input)

      if (out !== null)
        if (output !== null) throw new Error('`dev` directives ambiguous output')
        else output = out
    }

    return output
  }
}

const constructors: Record<string, new (value: any) => Directive> = {
  stub: Stub,
  throw: Throw,
  sleep: Sleep,
  faulty: Faulty
}
