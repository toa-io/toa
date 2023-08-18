import { type attributes } from '../../index'
import { Stub } from './Stub'

const constructors = new Map<string, attributes.Constructor>([
  ['stub', Stub]
])

export class Factory implements attributes.Factory {
  public readonly name: string = 'dev'

  public create (name: string, value: any): attributes.Attribute {
    const Class = constructors.get(name)

    if (Class === undefined)
      throw new Error(`Attribute '${name}' is not registered in provider "${this.name}"`)

    return new Class(value)
  }
}
