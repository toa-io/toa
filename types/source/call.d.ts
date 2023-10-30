export interface Request<Input = undefined>{
  input?: Input
  query?: Query
}

export interface Query{
  id?: string
  version?: number
  criteria?: string
  omit?: number
  limit?: number
  sort?: string[]
  projection?: string[]
}

export type Maybe<T> = T | Error
export type Call<Output = any, Input = any> = (request: Request<Input>) => Promise<Output>
export type Observation<Output = any, Input = undefined> = (request: Request<Input>) => Promise<Output | null>
