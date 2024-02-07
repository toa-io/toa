import { match } from 'matchacho'
import { properties, Property } from './Properties'
import { Embed } from './Embed'
import type { Properties } from './Properties'
import type { Directive } from './Directive'
import type { Family } from '../../Directive'
import type { Input, Output } from '../../io'

export class Vary implements Family {
  public readonly name = 'vary'
  public readonly mandatory = false

  public create (name: string, value: unknown): Property | Directive {
    return match(name,
      () => name in properties, (name: PN) => new Property(name, value as PV),
      () => name in directives, (name: keyof typeof directives) => new directives[name](value),
      () => {
        throw new Error(`Unknown directive 'vary:${name}'`)
      })
  }

  public preflight (instances: Array<Directive | Property>, request: Input): Output {
    /*
    To stop consructing `properties` object on each request, Directive Families must be refactored
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
      directive.preflight(request, properties)

    return null
  }
}

type PN = keyof Properties
type PV = Properties[PN]

const directives: Record<string, new (value: any) => Directive> = {
  embed: Embed
}
