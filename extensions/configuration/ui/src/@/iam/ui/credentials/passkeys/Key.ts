import json from '@/passkeys/ui/aaguid.json'
import type { Passkey } from '@/passkeys'

export interface Props {
  passkey: Passkey
}

interface Entry {
  name: string
  icon_dark?: string
  icon_light?: string
}

export interface Authenticator {
  name: string
  light?: string
  dark?: string
}

const map: Record<string, Entry> = json

/** Resolve authenticator metadata (name + light/dark icons) by AAGUID. */
export function resolve(aaguid: string): Authenticator | null {
  const entry = map[aaguid]

  if (entry === undefined) return null

  return { name: entry.name, light: entry.icon_light, dark: entry.icon_dark }
}
