import type { Request, Reply } from './request'
import type { Context } from './context'

export interface Algorithm {
  mount: (context?: Context) => Promise<void>

  execute: ((input: any, scope: object | object[]) => Promise<Reply>) |
  ((input: any) => Promise<Reply>) |
  (() => Promise<Reply>)
}

export interface Event {
  condition: (object: object) => Promise<boolean>

  payload: (object: object) => Promise<object>
}

export interface Receiver {
  condition: (object: object) => Promise<boolean>

  request: (object: object) => Promise<Request>
}

export interface Factory {
  algorithm?: (path: string, name: string, context: Context) => Algorithm

  event?: (path: string, label: string) => Event

  receiver?: (path: string, label: string) => Receiver
}
