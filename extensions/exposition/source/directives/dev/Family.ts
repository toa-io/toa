import { type Input, type Output, type Family } from '../../Directive'
import { Stub } from './Stub'
import { type Directive } from './Directive'

class Development implements Family {
  public readonly name: string = 'dev'

  public create (name: string, value: any): Directive {
    const Class = constructors[name]

    if (Class === undefined)
      throw new Error(`Directive '${name}' is not provided by '${this.name}'.`)

    return new Class(value)
  }

  public apply (directives: Directive[], input: Input): Output {
    for (const directive of directives) {
      const output = directive.apply(input)

      if (output !== null)
        return output
    }

    return null
  }
}

const constructors: Record<string, any> = {
  stub: Stub
}

export = new Development()
