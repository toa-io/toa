import { Status } from './Status.js'
import type { KeyConditionMethod } from '../Configuration.js'
import type { Condition } from './Condition.js'

type Constructor<T> = new (options: unknown) => T

export const Conditions: Record<KeyConditionMethod, Constructor<Condition>> = {
  status: Status
}

export type { Condition }
