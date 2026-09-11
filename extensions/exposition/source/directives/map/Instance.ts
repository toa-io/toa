import { Mapping } from './Mapping.js'
import type { Parameter } from '../../RTD/index.js'
import type { Input } from '../../io.js'
import type { Introspection, Schema } from '../../Introspection.js'

/**
 * Names the route parameter that carries the process a stateful operation is called on. The name
 * belongs to the call, so the parameter is taken out of what is embedded in the input and out of
 * the criteria, and left on the context for the endpoint to call with.
 */
export class Instance extends Mapping<string> {
  public constructor(parameter: unknown) {
    if (typeof parameter !== 'string' || parameter === '')
      throw new Error('`map:instance` must name a route parameter')

    super(parameter)
  }

  public override properties(context: Input, parameters: Parameter[]): null {
    const index = parameters.findIndex(({ name }) => name === this.value)

    if (index === -1) throw new Error(`Route parameter '${this.value}' is missing`)

    context.instance = parameters[index].value
    parameters.splice(index, 1)

    return null
  }

  /** The name is the caller's to send, so it is stated with the route. */
  public override explain(introspection: Introspection): void {
    introspection.route ??= {}
    introspection.route.instance = { type: 'string' } as unknown as Schema
  }
}
