import * as schemas from '@toa.io/schemas'
import { assertSecrets } from '@toa.io/definitions/extensions.configuration'
import { configured } from './lib/map.ts'
import { ERR_UNKNOWN_COMPONENT } from './lib/errors.ts'
import type { Schema } from '@toa.io/schemas'

export async function transition(input: Input, entry: Entity): Promise<Entity | Error> {
  const known = configured(input.component)

  if (known === undefined) return ERR_UNKNOWN_COMPONENT

  const configuration = structuredClone(input.configuration)

  const schema: Schema<any> = schemas.schema(known.schema)

  try {
    schema.validate(configuration)
    assertSecrets(known.schema, configuration)
  } catch (error) {
    // what the schema said of it is what whoever wrote the configuration has to read
    return new Error('INVALID_CONFIGURATION', { cause: (error as Error).message })
  }

  entry.component = input.component
  entry.epoch = known.epoch
  entry.configuration = configuration
  entry.originator = input.originator.id

  return entry
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
