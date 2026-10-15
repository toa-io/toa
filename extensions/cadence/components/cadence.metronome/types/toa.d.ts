// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query } from '@toa.io/core/types'
import type { Readable } from 'node:stream'

export interface Entity {
  /** Which dispatcher takes this row, as the outbox partitions its lanes */
  lane: number
  /** When the call is to be made, in milliseconds since the epoch */
  due: number
  /** After this the call is not made at all. A scan bounds on it, so a call nothing was running to make in time is a row nobody reads, rather than an event anything sees. */
  expires: number
  /** What to call, as `namespace.component.operation` */
  endpoint: string
  /** The request to make, as it was handed over */
  request?: Record<string, unknown>
  /** The chain of hops that asked for the call, which the call is then made by. A delay is a hop like any other, so a circle routed through one is still a circle. Absent where the caller unchained the call, and on a row written before this existed. */
  trail?: string[]
  /** The cron expression of a schedule an operation handed over. Present, the row is the whole of the schedule: settling it moves `due` to the next occurrence rather than disposing of it. */
  schedule?: string
  /** The time zone `schedule` is read in */
  zone?: string
  /** Milliseconds an occurrence of a schedule may be late and still be made. Absent, it is owed until the next occurrence comes due. */
  overdue?: number
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type State = Entity & { DISCARD: boolean, TRAILERS: Record<string, unknown> }

export type DelayInput = {
  endpoint: string
  request?: Record<string, unknown>
  trail?: string[]
  /** Milliseconds from now */
  interval: number
  /** Milliseconds the call may be late and still be made, or null for no bound. Stated rather than defaulted: only the caller knows whether a late call is still the right call. */
  overdue: number | null
}

export type DelayOutput = string

export type SettleInput = {
  /** The occurrence each recurring row was disposed of at, by id. A row that has moved past it since is left where it is. */
  made?: Record<string, number>
  /** Recurring rows that are over, which are disposed of rather than moved on */
  ended?: string[]
} | null

export type ResumeInput = {
  due: number
  lane: number
}

export interface Component {
  delay: (request: { input: DelayInput, task?: boolean }) => Promise<DelayOutput>
  settle: (request: { input: SettleInput, query: Query<Entity>, task?: boolean }) => Promise<unknown>
  resume: (request: { input: ResumeInput, query: Query<Entity>, task?: boolean }) => Promise<unknown>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, entity?: Partial<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}
