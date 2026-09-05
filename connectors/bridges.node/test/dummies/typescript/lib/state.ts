// shared code lives outside a scanned directory: a file in `operations` is an operation

export interface Reply {
  input: unknown
  state: unknown
  context: boolean
}

export function reply (input: unknown, state: unknown, context: unknown): Reply {
  return { input, state, context: context !== undefined }
}
