import { Connector, Request, Reply } from '@toa.io/core/types'
import * as comq from 'comq'

declare namespace toa.amqp {

  interface Communication extends Connector {
    request(queue: string, request: Request): Promise<Reply>

    reply(queue: string, process: comq.producer): Promise<void>
  }

}
