// noinspection ES6UnusedImports

import type { Error } from './error'

declare namespace toa.schema {

  type Type = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'

  type JSON = {
    $id?: string
    type?: Type
    properties?: Object
    patternProperties?: Object
    required?: string[]
    system?: boolean
    default?: any
    oneOf?: any[]
    enum?: any[]
    items?: JSON
    additionalProperties?: boolean
  }

  interface Schema {
    readonly schema: JSON

    fit(value: any): Error | null

    validate(value: any): void

    match(value: any): Error | null

    adapt(value: any): Error | null

    defaults(value?: any): Object

    system(): Object
  }

}

export type Schema = toa.schema.Schema
export type JSON = toa.schema.JSON
