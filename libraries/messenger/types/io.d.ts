declare namespace toa.messenger {

  type producer = (message: any) => Promise<any>

  namespace io {

    type Replies = {
      id: string
      queue: string
      once: (name: string, callback: Function) => void
      emit: (name: string, value: any) => void
    }

  }

  interface IO {
    reply(label: string, produce: producer): Promise<void>

    request(label: string, payload: object, encoding?: string): Promise<any>
  }

}
