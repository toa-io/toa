import type { Schema } from './schema'
import type { Namespace } from './namespace'

export function schema (cos: string): Schema

export function namespace (coses: any[] | string): Namespace

export type Schema = Schema
export type Namespace = Namespace
