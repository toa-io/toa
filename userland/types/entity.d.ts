/** What every stored record carries, beside the properties its component declares. */
export interface Entity {
  id: string
  _version: number
  _created: number
  _updated: number
  _deleted: number | null
  _trailers: Record<string, any>
}
