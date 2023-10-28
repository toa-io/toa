import { type Nopeable } from 'nopeable'

export interface Request<Input = undefined> {
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

export type Call<Output = any, Input = any> = (request: Request<Input>) => Promise<Nopeable<Output>>
export type Observation<Output = any, Input = undefined> = (request: Request<Input>) => Promise<Output | null>
