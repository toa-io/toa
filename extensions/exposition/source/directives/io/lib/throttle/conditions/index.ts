import { Status } from './Status.ts'
import type { KeyConditionMethod } from '../Configuration.ts'
import type { Condition } from './Condition.ts'
export type { Condition } from './Condition.ts'

type Constructor<T> = new (options: unknown) => T

export const Conditions: Record<KeyConditionMethod, Constructor<Condition>> = {
  status: Status
}
