import { contract } from '@toa.io/core'
import * as schemas from '@toa.io/schemas'

const { Request, Reply } = contract

export const request = (definition, entity) => {
  const request = Request.schema(definition, entity)
  const schema = schemas.schema(request, { removeAdditional: true })

  return new Request(schema, definition)
}

export const reply = (output, errors) => {
  const reply = Reply.schema(output, errors)

  // a reply is read, not shaped: what the operation returned is what the caller gets,
  // and a value that only fits once coerced does not fit
  const schema = schemas.schema(reply, { coerceTypes: false, useDefaults: false })

  return new Reply(schema)
}
