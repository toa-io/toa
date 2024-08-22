import { match } from 'matchacho'
import { properties, Property } from './Properties'
import { Embed } from './Embed'
import type { Properties } from './Properties'
import type { Directive } from './Directive'
import type { DirectiveFamily, Parameter } from '../../RTD'
import type { Input, Output } from '../../io'

export class Vary implements DirectiveFamily {
  public readonly name = 'vary'
  public readonly mandatory = false

  public create (name: string, value: unknown): Property | Directive {
    return match(name,
      () => name in properties, (name: PN) => new Property(name, value as PV),
      () => name in directives, (name: keyof typeof directives) => new directives[name](value),
      () => {
        throw new Error(`Directive 'vary:${name}' is not implemented`)
      })
  }

  public preflight (instances: Array<Directive | Property>,
    context: Input,
    parameters: Parameter[]): Output {
    /*
    To stop constructing `properties` object on each request, Directive Families must be refactored
    from singleton factories to per-Node instances on the Tree.
     */
    const properties: Properties = {}
    const directives: Directive[] = []

    for (const instance of instances)
      if (instance instanceof Property)
        properties[instance.name] = instance.value
      else
        directives.push(instance)

    for (const directive of directives)
      directive.preflight(context, properties, parameters)

    return null
  }
}

type PN = keyof Properties
type PV = Properties[PN]

const directives: Record<string, new (value: any) => Directive> = {
  embed: Embed
}
