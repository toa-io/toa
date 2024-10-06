import { match } from 'matchacho'
import { properties, Property } from './Properties'
import { Mapping } from './Mapping'
import { Headers } from './Headers'
import { Languages } from './Languages'
import { Language } from './Language'
import { Segments } from './Segments'
import { Authority } from './Authority'
import { Claims } from './Claims'
import type { Directive } from './Directive'
import type { Properties } from './Properties'
import type { DirectiveFamily, Parameter } from '../../RTD'
import type { Input, Output } from '../../io'
import type { Remotes } from '../../Remotes'

export class Map implements DirectiveFamily {
  public readonly name = 'map'
  public readonly mandatory = false

  private remotes!: Remotes

  public create (name: string, value: unknown, remotes: Remotes): Property | Mapping {
    this.remotes = remotes

    return match(name,
      () => properties.has(name), (name: PN) => new Property(name, value as PV),
      () => name in mappings, (name: keyof typeof mappings) => new mappings[name](value, remotes),
      () => {
        throw new Error(`Directive 'map:${name}' is not implemented`)
      })
  }

  public async preflight (directives: Directive[], context: Input, parameters: Parameter[]): Promise<Output> {
    const properties = {}

    for (const directive of directives)
      if (directive instanceof Mapping)
        Object.assign(properties, await directive.properties(context, parameters, directives))

    context.pipelines.body.push((body: unknown) => {
      if (body === undefined || body === null || typeof body !== 'object')
        return properties
      else
        return Object.assign(body, properties)
    })

    return null
  }
}

type PN = keyof Properties
type PV = Properties[PN]

const mappings: Record<string, new (value: any, remotes: Remotes) => Directive> = {
  authority: Authority,
  headers: Headers,
  languages: Languages,
  language: Language,
  segments: Segments,
  claims: Claims
}
