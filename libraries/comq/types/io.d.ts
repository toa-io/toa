declare namespace toa.comq {

  type producer = (message: any) => Promise<any>
  type consumer = (message: any) => Promise<void>

  interface ReplyEmitter {
    queue: string

    once(name: string, callback: Function): void

    emit(name: string, value: any): void
  }

  interface IO {
    reply(queue: string, produce: producer): Promise<void>

    request(queue: string, payload: object, encoding?: string): Promise<any>

    consume(exchange: string, group: string, consumer: consumer): Promise<void>

    seal(): Promise<void>

    close(): Promise<void>
  }

}

export type IO = toa.comq.IO
