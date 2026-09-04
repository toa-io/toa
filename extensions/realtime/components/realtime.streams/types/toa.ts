// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.


export type CreateInput = {
  key?: string
  token?: string
}

export type PushInput = {
  data?: unknown
  key: string
  event: string
}

export interface Component {
  create: (request: { input: CreateInput, task?: boolean }) => Promise<unknown>
  push: (request: { input: PushInput, task?: boolean }) => Promise<unknown>
}
