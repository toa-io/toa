import * as schemas from '@toa.io/schemas'
import { assertSecrets } from '@toa.io/definitions/extensions.configuration'
import { configured } from './lib/map.ts'
import { UnknownComponentError } from './lib/errors.ts'
import type { Schema } from '@toa.io/schemas'

export async function transition(input: Input, entry: Entity): Promise<Entity | Error> {
  const known = configured(input.component)

  if (known === undefined) return new UnknownComponentError(input.component)

  const configuration = structuredClone(input.configuration)

  const schema: Schema<any> = schemas.schema(known.schema)

  try {
    schema.validate(configuration)
    assertSecrets(known.schema, configuration)
  } catch (error) {
    return new InvalidConfigurationError((error as Error).message)
  }

  entry.component = input.component
  entry.epoch = known.epoch
  entry.configuration = configuration
  entry.originator = input.originator.id

  return entry
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
