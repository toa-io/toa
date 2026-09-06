/** What a schema answers where a value does not fit it. */
export interface SchemaError {
  message: string
  keyword: string
  schema: string
  property?: string
  path?: string
}

export interface Schema<T = any> {
  id: string

  /** `null` where the value fits, the first error otherwise */
  fit(value: unknown): SchemaError | null

  validate<V = T>(value: unknown, message?: string): asserts value is V
}

export type schema = (schema: any) => Schema

export type is = (object: object) => boolean
