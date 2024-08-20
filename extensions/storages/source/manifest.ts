export function manifest (manifest: string | string[] | null): string[] {
  if (manifest === null)
    return []

  if (typeof manifest === 'string')
    return [manifest]

  return manifest
}
