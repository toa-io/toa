import { environment } from '@toa.io/generic'

/**
 * The issuer an authority is named by: `https://` and the host the exposition annotation maps
 * it to, as the gateway names the issuer in its discovery documents. This component is
 * composed into the gateway's process, so it reads the same properties the gateway was
 * deployed with, rather than a second map of hosts that could disagree with the first.
 */
export function issuer(authority: string): string | undefined {
  const authorities = read()

  return Object.hasOwn(authorities, authority)
    ? `https://${authorities[authority]}`
    : undefined
}

/** Parsed once per value: a test deploys the gateway again with other properties. */
function read(): Record<string, string> {
  const properties = environment.get(PROPERTIES) ?? '{}'

  if (properties !== last) {
    last = properties
    authorities = (JSON.parse(properties) as Properties).authorities ?? {}
  }

  return authorities
}

let last: string | undefined
let authorities: Record<string, string> = {}

const PROPERTIES = 'TOA_EXPOSITION_PROPERTIES'

interface Properties {
  authorities?: Record<string, string>
}
