import { contract } from '@toa.io/core'
import * as schemas from '@toa.io/schemas'

const { Request, Reply } = contract

export const request = (definition, entity) => {
  const request = Request.schema(definition, entity)
  const schema = schemas.schema(request)

  return new Request(schema, definition, entity)
}

export const reply = (output, errors) => {
  const reply = Reply.schema(output, errors)

  // a reply is read, not shaped: a value that only fits once coerced does not fit
  const schema = schemas.schema(reply, { coerceTypes: false })

  return new Reply(schema)
}
