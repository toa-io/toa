import { contract } from '@toa.io/core'
import * as schemas from '@toa.io/schemas'

const { Request, Reply } = contract

const request = (definition, entity) => {
  const request = Request.schema(definition, entity)
  const schema = schemas.schema(request, { removeAdditional: true })

  return new Request(schema, definition)
}

const reply = (output, errors) => {
  const reply = Reply.schema(output, errors)
  const schema = schemas.schema(reply)

  return new Reply(schema)
}

export { request, reply }
