export interface Query<E = unknown> {
  id?: string
  version?: number
  criteria?: string
  omit?: number
  limit?: number
  sort?: string[]
  projection?: Array<keyof E>
  deleted?: boolean
}

export interface Request<Input = unknown, E = unknown> {
  input?: Input
  query?: Query<E>
  entity?: E
  task?: boolean
}

/**
 * An error an operation declares and returns. A call resolves to it rather than throwing —
 * only an exception is thrown.
 */
export interface RemoteError<Code extends string = string> extends Error {
  code: Code
}

export type Maybe<T> = T | Error

/**
 * What a receiver is given: the state after the change, the state before it — `null` where
 * there was none — and the trailers the transition left.
 */
export interface Event<State, Trailers = Record<string, unknown>> {
  origin: State | null
  state: State
  trailers: Trailers
}
