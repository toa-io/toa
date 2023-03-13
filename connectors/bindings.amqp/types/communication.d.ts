import { Connector } from '@toa.io/core/types'
import * as comq from 'comq'

declare namespace toa.amqp {

  interface Communication extends Connector {
    reply(queue: string, process: comq.producer): Promise<void>
  }

}
