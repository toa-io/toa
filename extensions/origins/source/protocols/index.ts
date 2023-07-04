'use strict'

import amqp from './amqp'
import http from './http'

export = [http, amqp] as Protocol[]

interface Protocol {
  id: string
  protocols: string[]
}
