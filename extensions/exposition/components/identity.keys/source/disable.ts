export function transition(_: unknown, entry: Key): Key {
  entry.revokedAt ??= Date.now()

  return entry
}

interface Key {
  revokedAt?: number
}
