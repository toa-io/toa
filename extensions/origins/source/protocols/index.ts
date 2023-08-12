'use strict'

import { type Resolver } from '../Factory'
import amqp from './amqp'
import http from './http'
import type { extensions } from '@toa.io/core'

export const protocols: Protocol[] = [http, amqp]

export interface Protocol {
  id: ProtocolID
  protocols: string[]
  create: (resolver: Resolver) => extensions.Aspect
}

export type ProtocolID = 'http' | 'amqp'
