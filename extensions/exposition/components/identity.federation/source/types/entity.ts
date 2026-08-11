export interface Entity {
  id: string
  authority: string
  iss: string
  sub: string
  identity?: string
  _created: number
}
