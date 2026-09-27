export function transition(input: Input, entry: Entity): Entity {
  entry.banned = input.banned
  entry.originator = input.originator.id
  entry.comment = input.comment

  return entry
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
