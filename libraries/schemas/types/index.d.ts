import type { Schema } from './schema.js'
import type { Namespace } from './namespace.js'
import type { Options as AjvOptions } from 'ajv'

export function schema (cos: any, options?: AjvOptions): Schema

export function namespace (coses: any[] | string): Namespace


export type { Schema } from './schema.js'
export type { Namespace } from './namespace.js'
