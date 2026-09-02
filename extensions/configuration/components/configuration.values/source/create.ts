import * as schemas from '@toa.io/schemas'
import { entry } from './lib/map'
import type { Schema } from '@toa.io/schemas'

export async function transition (input: Input, object: Entity): Promise<Entity | Error> {
  const known = entry(input.component)

  if (known === undefined)
    return new UnknownComponentError(input.component)

  // the schema fills its defaults, so what is stored is whole
  const configuration = structuredClone(input.configuration)

  const schema: Schema<any> = schemas.schema(known.schema)

  try {
    schema.validate(configuration)
  } catch (error) {
    return new InvalidConfigurationError((error as Error).message)
  }

  object.component = input.component
  object.epoch = known.epoch
  object.configuration = configuration
  object.originator = input.originator.id

  return object
}

class UnknownComponentError extends Error {
  public readonly code = 'UNKNOWN_COMPONENT'

  public constructor (component: string) {
    super(`Component '${component}' is not configured`)
  }
}

class InvalidConfigurationError extends Error {
  public readonly code = 'INVALID_CONFIGURATION'
}

interface Input {
  component: string
  configuration: object
  originator: {
    id: string
  }
}

interface Entity {
  id: string
  component: string
  epoch: string
  configuration: object
  originator: string
}
