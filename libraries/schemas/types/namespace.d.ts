import type { Schema } from './schema.js'

export interface Namespace{
  schema<T = any> (id: string): Schema<T>
}
