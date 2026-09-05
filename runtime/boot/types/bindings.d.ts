import type { bindings } from '@toa.io/core/types'

export function broadcast<T> (name: string, group?: string, binding?: string): bindings.Broadcast<T>
