import { ConsumeMessage, MessageProperties } from 'amqplib'

declare namespace toa.messenger {

  namespace channel {

    type Queue = {
      assertion?: Promise<any>
    }

  }

  namespace message {

    type Properties = Partial<MessageProperties>

  }

  type consumer = (message: ConsumeMessage) => void | Promise<void>

  interface Channel {
    consume(queue: string, durable: boolean, consumer: consumer): Promise<void>

    deliver(queue: string, buffer: Buffer, properties: message.Properties): Promise<void>

    send(queue: string, buffer: Buffer, properties: message.Properties): Promise<void>
  }

}

export type Channel = toa.messenger.Channel
