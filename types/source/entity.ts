export interface Entity {
  id: string
  _version: number
  _created: number
  _updated: number
  _deleted: null | number
  _trailers: Record<string, any>
}
