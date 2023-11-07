import Negotiator from 'negotiator'

export function negotiate (accept: string, available: string[]): string | null {
  return new Negotiator({ headers: { accept } }).mediaType(available) ?? null
}
