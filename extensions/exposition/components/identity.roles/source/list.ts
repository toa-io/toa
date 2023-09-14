export function observation (_: unknown, objects: Entity[]): string[] {
  return objects.map(({ role }) => role)
}

interface Entity {
  role: string
}
