import type { Schema } from './schema'
import type { Namespace } from './namespace'
import type { Options as AjvOptions } from 'ajv'

export function schema (cos: any, options?: AjvOptions): Schema

export function namespace (coses: any[] | string): Namespace


export type { Schema } from './schema'
export type { Namespace } from './namespace'
