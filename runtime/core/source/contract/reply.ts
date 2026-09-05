import { Contract } from './contract.js'
import { ResponseContractException } from '../exceptions.js'
import type { Refusal } from './contract.js'
import type { JSONSchema } from './schemas.js'

export class Reply extends Contract {
  public static override Exception: Refusal =
    ResponseContractException as unknown as Refusal

  public static schema (output?: JSONSchema, errors?: Array<string | number>): JSONSchema {
    const schema: JSONSchema =
      { type: 'object', properties: {}, additionalProperties: false }

    if (output !== undefined) {
      /*
       * A reply carries more than the operation declares — `_version` and the rest of the
       * record's own fields — so what it is validated against is the declaration relaxed.
       * On a copy: the declaration itself is what a component publishes when asked to
       * explain, and relaxing that would publish a contract nobody wrote.
       */
      output = structuredClone(output)

      if (output.type === 'object')
        output.additionalProperties = true
      else if (output.type === 'array' && output.items?.type === 'object')
        output.items.additionalProperties = true

      schema.properties.output = output
    }

    /*
     * An error a caller is meant to handle is one the operation states. Where none are
     * stated, an error is not a reply this operation makes — it is a mistake, and the
     * contract says so rather than passing an undeclared code on to whoever called.
     */
    schema.properties.error = errors === undefined
      ? false
      : {
          type: 'object',
          properties: {
            code: {
              enum: errors
            },
            message: {
              type: 'string'
            }
          },
          required: ['code']
        }

    return schema
  }
}
