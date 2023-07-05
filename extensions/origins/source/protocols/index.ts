'use strict'

import { type URIMap } from '@toa.io/pointer'
import amqp from './amqp'
import http from './http'
import type { extensions } from '@toa.io/core'

export const protocols: Protocol[] = [http, amqp]

export interface Protocol {
  id: ProtocolID
  protocols: string[]
  create: (uris: URIMap, properties: any) => extensions.Aspect
}

export type ProtocolID = 'http' | 'amqp'
