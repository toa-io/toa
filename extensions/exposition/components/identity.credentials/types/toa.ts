// Written by `toa types`. Every run rewrites it.
// What a manifest does not state belongs in a file of your own.


export type ListInput = {
  authority: string
  identity: string
}

export type ListOutput = {
  basic: {
    username: string
  } | null
  federation: Array<{
    id: string
    iss: string
    _created: number
  }>
  passkeys: Array<{
    id: string
    aid: string
    synced: boolean
    label?: string
    _created: number
  }>
}

export interface Component {
  list: (request: { input: ListInput, task?: boolean }) => Promise<ListOutput>
}
