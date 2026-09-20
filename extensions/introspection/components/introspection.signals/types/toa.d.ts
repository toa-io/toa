// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.

import type { Query } from '@toa.io/core/types'
import type { Readable } from 'node:stream'

export interface Entity {
  /** What the processes are being told to do */
  type: "halt" | "stop"
  /** How long every process stays disconnected before it builds itself again */
  seconds: number
  /** How long the deployment is given to go quiet before the map is read */
  quiescence: number
  /** How long a process that has found the deployment busy waits before it leaves */
  grace?: number
  /** The halt a stop answers */
  signal?: string
  id: string
  VERSION: number
  CREATED: number
  UPDATED: number
  DELETED: number | null
  REGION: number
}

export type CreateInput = {
  type: string
  seconds: number
  quiescence: number
  grace?: number
  signal?: string
}

export type TransitInput = {
  type: string
  seconds: number
  quiescence: number
  grace?: number
  signal?: string
}

export type ConfigurationOutput = {
  halt?: {
    duration: number[]
    quiescence: number[]
  }
}

export interface Component {
  /** Tell every process of this deployment to do something. */
  create: (request: { input: CreateInput, task?: boolean }) => Promise<unknown>
  transit: (request: { input: TransitInput, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  /** What a signal of this deployment may ask for, in seconds. */
  configuration: (request: { input?: null, task?: boolean }) => Promise<ConfigurationOutput>
  assign: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  ensure: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
  enumerate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity[]>
  observe: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity | null>
  stream: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Readable>
  terminate: (request: { input?: null, query?: Query<Entity>, task?: boolean }) => Promise<Entity>
}
