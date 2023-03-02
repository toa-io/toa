import * as _diagnostics from './diagnostic'
import { encoding } from './encoding'

declare namespace comq {

  type producer = (message: any) => Promise<any>
  type consumer = (message: any) => Promise<void>

  interface ReplyEmitter {
    queue: string

    once(name: string, callback: Function): void

    emit(name: string, value: any): void
  }

  interface IO {
    reply(queue: string, produce: producer): Promise<void>

    request(queue: string, payload: any, encoding?: encoding): Promise<any>

    consume(exchange: string, group: string, consumer: consumer): Promise<void>

    emit(exchange: string, payload: any, encoding?: encoding): Promise<void>

    seal(): Promise<void>

    close(): Promise<void>

    diagnose(event: _diagnostics.event, listener: Function): void
  }

}

export type IO = comq.IO
