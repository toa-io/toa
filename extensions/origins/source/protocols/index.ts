import amqp from './amqp'
import http from './http'
import pubsub from './pubsub'
import type { Declaration } from '../Factory'
import type { extensions } from '@toa.io/core'

export const protocols: Protocol[] = [http, amqp, pubsub]

export interface Protocol {
  id: ProtocolID
  protocols: string[]
  create: (declaration: Declaration) => extensions.Aspect
}

export type ProtocolID = 'http' | 'amqp' | 'pubsub'
