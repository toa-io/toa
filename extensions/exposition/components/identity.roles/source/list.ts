import { type Reply } from '@toa.io/types'

export function observation (_: unknown, objects: Entity[]): Reply<string[]> {
  const output = objects.map(({ role }) => role)

  return { output }
}

interface Entity {
  role: string
}
