import { revision } from '@toa.io/definitions/extensions.configuration'
import { entry } from './lib/map.ts'
import { UnknownComponentError } from './lib/errors.ts'

/**
 * The deployed defaults, as a new object. The revision tells it from a created one: it is
 * what a component checks the defaults against, and what makes `resolve` serve the defaults
 * deployed now rather than those stored.
 */
export async function transition(input: Input, object: Entity): Promise<Entity | Error> {
  const known = entry(input.component)

  if (known === undefined) return new UnknownComponentError(input.component)

  object.component = input.component
  object.epoch = known.epoch
  object.configuration = structuredClone(known.defaults ?? {})
  object.revision = revision(known.defaults)
  object.originator = input.originator.id

  return object
}

interface Input {
  component: string
  originator: {
    id: string
  }
}

interface Entity {
  id: string
  component: string
  epoch: string
  configuration: object
  revision: string
  originator: string
}
