declare namespace toa.core {

  type Message = {
    payload: Object

    [key: string]: any // extensions
  }

}

export type Message = toa.core.Message
