export interface Request<Input> {
  input?: Input
  query?: Query
}

export interface Query {
  id?: string
  version?: number
  criteria?: string
  omit?: number
  limit?: number
  sort?: string[]
  projection?: string[]
}

export type Reply<Output> = {
  output?: Output
  error?: Error
}

export interface Error {
  code: number
  message?: string

  [key: string]: any
}

export type Call<Output = any, Input = any> = (request: Request<Input>) => Promise<Reply<Output>>
export type Observation<Output = any, Input = undefined> = (request: Request<Input>) => Promise<Reply<Output> | null>
