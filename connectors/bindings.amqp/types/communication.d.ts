import { Connector, Request, Reply, Message } from '@toa.io/core/types'
import * as comq from 'comq'

declare namespace toa.amqp {

  interface Communication extends Connector {
    request(queue: string, request: Request): Promise<Reply>

    reply(queue: string, process: comq.producer): Promise<void>

    emit(exchange: string, message: Message): Promise<void>
  }

}
