import { ConsumeMessage, MessageProperties, Options } from 'amqplib'

declare namespace toa.comq {

  namespace channel {

    type Queue = {
      assertion?: Promise<any>
    }

  }

  type consumer = (message: ConsumeMessage) => void | Promise<void>

  interface Channel {
    consume(queue: string, durable: boolean, consumer: consumer): Promise<void>

    deliver(queue: string, buffer: Buffer, properties: Options.Publish): Promise<void>

    send(queue: string, buffer: Buffer, properties: Options.Publish): Promise<void>

    close(): Promise<void>
  }

}

export type Channel = toa.comq.Channel
