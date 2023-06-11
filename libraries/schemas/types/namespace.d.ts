import type { Schema } from './schema'

export interface Namespace {
  schema (id: string): Schema
}
