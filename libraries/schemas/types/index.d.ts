import type { Schema } from './schema'
import type { Namespace } from './namespace'

export function schema (cos: any): Schema

export function namespace (coses: any[] | string): Namespace

export function expand (cos: object): object

export type { Schema } from './schema'
export type { Namespace } from './namespace'
