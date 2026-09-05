import { match } from 'matchacho'
import { properties, Property } from './Properties.js'
import { Mapping } from './Mapping.js'
import { Headers } from './Headers.js'
import { Languages } from './Languages.js'
import { Language } from './Language.js'
import { Segments } from './Segments.js'
import { Authority } from './Authority.js'
import { BufferMapping } from './Buffer.js'
import { Claims } from './Claims.js'
import type { Directive } from './Directive.js'
import type { Properties } from './Properties.js'
import type { DirectiveFamily, Parameter } from '../../RTD/index.js'
import type { Input, Output } from '../../io.js'
import type { Introspection } from '../../Introspection.js'
import type { Remotes } from '../../Remotes.js'

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

  public explain (directives: Directive[], _: Input, introspection: Introspection): Introspection {
    for (const directive of directives)
      if (directive instanceof Mapping)
        directive.explain(introspection)

    return introspection
  }

  public async precall (directives: Directive[], context: Input, parameters: Parameter[]): Promise<Output> {
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
  buffer: BufferMapping,
  headers: Headers,
  languages: Languages,
  language: Language,
  segments: Segments,
  claims: Claims
}
