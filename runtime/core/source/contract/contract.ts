import { SystemException } from '../exceptions.ts'
import type { Schema, SchemaError } from '@toa.io/schemas'
import type { Exception } from '../exceptions.ts'

/** What a contract throws with, stated by the subclass. */
export type Refusal = new (error: SchemaError, cause?: unknown) => Exception

export class Contract {
  public readonly schema: Schema

  public static Exception: Refusal = SystemException as unknown as Refusal

  public constructor(schema: Schema) {
    this.schema = schema
  }

  public fit(value: unknown): void {
    const error = this.schema.fit(value)

    if (error !== null)
      throw new (this.constructor as typeof Contract).Exception(error, value)
  }
}
