import { collection, values } from 'svas'
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

export type Node = origin.Node
export type Edge = origin.Edge
export type Entity = origin.Entity
export type Operation = origin.Operation
export type Event = origin.Event
export type Receiver = origin.Receiver
