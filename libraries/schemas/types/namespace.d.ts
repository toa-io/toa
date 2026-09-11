import type { Schema } from './schema.d.ts'

export interface Namespace {
  schema<T = any>(id: string): Schema<T>
}
