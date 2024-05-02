import { create } from './Aspect'
import type { Protocol } from '../index'

export = {
  id: 'pubsub',
  protocols: ['pubsub:'],
  create
} satisfies Protocol
