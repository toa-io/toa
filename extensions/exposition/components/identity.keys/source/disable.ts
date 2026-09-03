export function transition (_: unknown, object: Key): Key {
  object.revokedAt ??= Date.now()

  return object
}

interface Key {
  revokedAt?: number
}
