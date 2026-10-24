// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.


export type RecordInput = {
  id: string
  label: string
  component: string
  time: number
  entity?: null
  version?: null
  identity?: string | null
  trace?: string | null
  payload: Record<string, unknown>
}

export interface Component {
  record: (request: { input: RecordInput, task?: boolean }) => Promise<unknown>
}
