import { resolve } from 'node:path'

import { readFileSync } from 'node:fs'
import { load as parseYAML } from 'js-yaml'
import * as schemas from '@toa.io/schemas'

const path = resolve(import.meta.dirname, 'schema.yaml')
const object = parseYAML(readFileSync(path, 'utf8'))
const schema = schemas.schema(object)

export const validate = (context) => {
  schema.validate(context)
}
