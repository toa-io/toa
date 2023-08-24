import { Stub } from './Stub'
import type * as directives from '../index'

export class Factory implements directives.Factory {
  public readonly name: string = 'dev'

  public create (name: string, value: any): directives.Directive {
    const Class = constructors.get(name)

    if (Class === undefined)
      throw new Error(`Directive '${name}' is not provided by '${this.name}'.`)

    return new Class(value)
  }
}

const constructors = new Map<string, directives.Constructor>([
  ['stub', Stub]
])
