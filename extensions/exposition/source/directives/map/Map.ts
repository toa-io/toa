import { match } from 'matchacho'
import { properties, Property } from './Properties.ts'
import { Mapping } from './Mapping.ts'
import { Headers } from './Headers.ts'
import { Languages } from './Languages.ts'
import { Language } from './Language.ts'
import { Segments } from './Segments.ts'
import { Instance } from './Instance.ts'
import { Authority } from './Authority.ts'
import { Country, IP } from './Client.ts'
import { BufferMapping } from './Buffer.ts'
import { StreamMapping } from './Stream.ts'
import { Claims } from './Claims.ts'
import type { Directive } from './Directive.ts'
import type { Properties } from './Properties.ts'
import type { DirectiveFamily, Parameter } from '../../RTD/index.ts'
import type { Input, Output } from '../../io.ts'
import type { Introspection } from '../../Introspection.ts'
import type { Remotes } from '../../Remotes.ts'

export class Map implements DirectiveFamily {
  public readonly name = 'map'
  public readonly mandatory = false

  private remotes!: Remotes

  public create(name: string, value: unknown, remotes: Remotes): Property | Mapping {
    this.remotes = remotes

    return match(
      name,
      () => properties.has(name),
      (name: PN) => new Property(name, value as PV),
      () => name in mappings,
      (name: keyof typeof mappings) => new mappings[name](value, remotes),
      () => {
        throw new Error(`Directive 'map:${name}' is not implemented`)
      }
    )
  }

  public explain(directives: Directive[], introspection: Introspection): Introspection {
    for (const directive of directives)
      if (directive instanceof Mapping) directive.explain(introspection)

    return introspection
  }

  public async precall(
    directives: Directive[],
    context: Input,
    parameters: Parameter[]
  ): Promise<Output> {
    const properties = {}

    // whether any mapping fills the input: `map:instance` names the call's process and fills
    // nothing, and a route mapping that alone keeps an input of none as none
    let fills = false

    for (const directive of directives)
      if (directive instanceof Mapping) {
        Object.assign(
          properties,
          await directive.properties(context, parameters, directives)
        )

        if (!(directive instanceof Instance)) fills = true
      }

    if (!fills) return null

    // a property a mapping has no value for is taken out of the body, rather than left as the
    // caller said it
    context.pipelines.body.push((body: unknown) => {
      const input =
        body === undefined || body === null || typeof body !== 'object'
          ? {}
          : (body as Record<string, unknown>)

      for (const [property, value] of Object.entries(properties))
        if (value === undefined) delete input[property]
        else input[property] = value

      return input
    })

    return null
  }
}

type PN = keyof Properties
type PV = Properties[PN]

const mappings: Record<string, new (value: any, remotes: Remotes) => Directive> = {
  authority: Authority,
  ip: IP,
  country: Country,
  buffer: BufferMapping,
  stream: StreamMapping,
  headers: Headers,
  languages: Languages,
  language: Language,
  segments: Segments,
  instance: Instance,
  claims: Claims
}
