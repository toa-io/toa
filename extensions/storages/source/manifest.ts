import { match } from 'matchacho'

export function manifest (manifest: string | string[] | null): string[] {
  return match(manifest,
    String, (name: string) => [name],
    Array, manifest,
    null, [])
}
