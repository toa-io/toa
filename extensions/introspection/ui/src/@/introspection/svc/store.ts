import { collection, value, values } from 'svas'
import { account } from '@/iam/svc/store'
import * as origin from './net'

export const nodes = collection<Node>({
  get: origin.get,
  values: values<Node>(),
  persist: 'introspection:nodes',
  bind: account,
  stale: true,
})

export const edges = collection<Edge>({
  get: origin.list,
  values: values<Edge>(),
  persist: 'introspection:edges',
  bind: account,
  stale: true,
})

/**
 * What a halt may ask for. Not persisted: it is what the deployment was last annotated with,
 * and a form that asked for something a redeploy has since narrowed would be refused by the
 * bounds rather than by the field.
 */
export const bounds = value<origin.Bounds>({
  get: origin.bounds,
  bind: account,
})

export type Node = origin.Node
export type Edge = origin.Edge
export type Entity = origin.Entity
export type Operation = origin.Operation
export type Event = origin.Event
export type Receiver = origin.Receiver
export type Bounds = origin.Bounds
export type Range = origin.Range
export type Signal = origin.Signal
