import type { Schema } from './schema.d.ts'
import type { Namespace } from './namespace.d.ts'
import type { Options as AjvOptions } from 'ajv'

export function schema(cos: any, options?: AjvOptions): Schema

export function namespace(coses: any[] | string): Namespace

export type { Schema, SchemaError } from './schema.d.ts'
export type { Namespace } from './namespace.d.ts'
