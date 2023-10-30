import { match } from '@toa.io/match'

export function manifest (manifest: string | string[] | null): string[] {
  return match(manifest,
    () => typeof manifest === 'string', (name: string) => [name],
    Array, manifest,
    null, [])
}
