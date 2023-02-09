import { ConsumeMessage, MessageProperties, Options } from 'amqplib'

declare namespace comq {

  namespace channel {

    type Queue = {
      assertion?: Promise<any>
    }

    type consumer = (message: ConsumeMessage) => void | Promise<void>

  }

  interface Channel {
    consume(queue: string, durable: boolean, consumer: channel.consumer): Promise<void>

    deliver(queue: string, buffer: Buffer, properties: Options.Publish): Promise<void>

    send(queue: string, buffer: Buffer, properties: Options.Publish): Promise<void>

    subscribe(exchange: string, queue: string, consumer: channel.consumer): Promise<void>

    close(): Promise<void>
  }

}

export type Channel = comq.Channel
