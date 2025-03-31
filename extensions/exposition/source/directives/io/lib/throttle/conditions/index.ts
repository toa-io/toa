import { Status } from './Status'
import type { KeyConditionMethod } from '../Configuration'
import type { Condition } from './Condition'

type Constructor<T> = new (options: unknown) => T

export const Conditions: Record<KeyConditionMethod, Constructor<Condition>> = {
  status: Status
}

export type { Condition }
