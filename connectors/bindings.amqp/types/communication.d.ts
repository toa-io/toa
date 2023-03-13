import { Connector, Request, Reply, Message, Receiver } from '@toa.io/core/types'
import * as comq from 'comq'

declare namespace toa.amqp {

  interface Communication extends Connector {
    request(queue: string, request: Request): Promise<Reply>

    reply(queue: string, process: comq.producer): Promise<void>

    emit(exchange: string, message: Message): Promise<void>

    consume(exchange: string, group: string, callback: comq.consumer): Promise<void>
  }

}
