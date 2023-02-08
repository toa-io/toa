declare namespace toa.messenger {

  type producer = (message: any) => Promise<any>

  type Replies = {
    queue: string
    once: (name: string, callback: Function) => void
    emit: (name: string, value: any) => void
  }

  interface IO {
    reply(label: string, produce: producer): Promise<void>

    request(label: string, payload: object, encoding?: string): Promise<any>

    close(): Promise<void>
  }

}

export type IO = toa.messenger.IO
