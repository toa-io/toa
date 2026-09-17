import { resolve } from 'node:path'

import { readFileSync } from 'node:fs'
import { yaml } from '@toa.io/generic'
import * as schemas from '@toa.io/schemas'

const path = resolve(import.meta.dirname, 'schema.yaml')
const object = yaml.load(readFileSync(path, 'utf8'))
const schema = schemas.schema(object)

export const validate = (context) => {
  schema.validate(context, CONTEXT)
}

/** The file a reader has to edit, since nothing else in the message names it. */
const CONTEXT = 'context.toa.yaml'
