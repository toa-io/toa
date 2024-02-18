import type { Schema } from './schema'

export interface Namespace{
  schema<T = any> (id: string): Schema<T>
}
