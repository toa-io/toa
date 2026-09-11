import { Mapping } from './Mapping.ts'
import { take } from '../../Introspection.ts'
import type { Parameter } from '../../RTD/index.ts'
import type { Introspection, Schema } from '../../Introspection.ts'

export class Segments extends Mapping<Record<string, string>> {
  public constructor(map: Record<string, string>) {
    if (map.constructor !== Object) throw new Error('`map:segments` must be an object')

    if (!Object.values(map).every((value) => typeof value === 'string'))
      throw new Error('`map:segments ` must be an object with string values')

    super(map)
  }

  /** A segment is the caller's, so it moves to the route rather than out of sight. */
  public override explain(introspection: Introspection): void {
    for (const property of Object.keys(this.value)) {
      const schema = take(introspection, property)

      introspection.route ??= {}
      introspection.route[property] = schema ?? ({ type: 'string' } as unknown as Schema)
    }
  }

  public override properties(
    _: unknown,
    parameters: Parameter[]
  ): Record<string, string> {
    return Object.entries(this.value).reduce(
      (properties: Record<string, string>, [property, parameter]) => {
        const cut = parameter[0] === '~'

        if (cut) parameter = parameter.slice(1)

        const index = parameters.findIndex(({ name }) => name === parameter)

        if (!(index > -1)) throw new Error(`Route parameter '${parameter}' is missing`)

        properties[property] = parameters[index].value

        if (cut) parameters.splice(index, 1)

        return properties
      },
      {}
    )
  }
}
