export interface Request<Input> {
  input?: Input
  query?: Query
}

export interface Query {
  id?: string
  version?: number
  criteria?: object
  omit?: number
  limit?: number
  sort?: string[]
  projection?: string[]
}

export interface Reply<Output> {
  output?: Output
  error?: Error
}

export interface Error {
  code: number
  message?: string

  [key: string]: any
}

export type call<Input, Output> = (request: Request<Input>) => Promise<Reply<Output>>
