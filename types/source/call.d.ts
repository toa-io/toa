declare namespace toa {

  type Request<Input> = {
    input?: Input
    query?: Query
  }

  type Query = {
    id?: string
    version?: number
    criteria?: Object
    omit?: number
    limit?: number
    sort?: string[]
    projection?: string[]
  }

  type Reply<Output> = {
    output?: Output
    error?: Error
  }

  type Error = {
    code: number
    message?: string

    [key: string]: any
  }

  type call<Input, Output> = (request: Request<Input>) => Promise<Reply<Output>>

}

export type Request<Input> = toa.Request<Input>
export type Reply<Output> = toa.Reply<Output>
export type call<Input, Output> = toa.call<Input, Output>
