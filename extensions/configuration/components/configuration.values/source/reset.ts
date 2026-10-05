import { revision } from '@toa.io/definitions/extensions.configuration'
import { configured } from './lib/map.ts'
import { ERR_UNKNOWN_COMPONENT } from './lib/errors.ts'

/**
 * The deployed defaults, as a new object. The revision tells it from a created one: it is
 * what a component checks the defaults against, and what makes `resolve` serve the defaults
 * deployed now rather than those stored.
 */
export async function transition(input: Input, entry: Entity): Promise<Entity | Error> {
  const known = configured(input.component)

  if (known === undefined) return ERR_UNKNOWN_COMPONENT

  entry.component = input.component
  entry.epoch = known.epoch
  entry.configuration = structuredClone(known.defaults ?? {})
  entry.revision = revision(known.defaults)
  entry.originator = input.originator.id

  return entry
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
