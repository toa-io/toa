export function transition (input: Input, object: Entity): Entity {
  object.banned = input.banned
  object.originator = input.originator.id
  object.comment = input.comment

  return object
}

interface Entity {
  banned: boolean
  originator: string
  comment?: string
}

interface Input {
  banned: boolean
  originator: {
    id: string
  }
  comment?: string
}
