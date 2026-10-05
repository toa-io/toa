/**
 * An error a storage answers with. Its message is its code, so an operation that returns it
 * refuses with that code, and it carries the code as a call's error does, so whoever asked
 * the storage reads it the same way.
 */
export function coded(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code })
}

export const ERR_NOT_FOUND = coded('NOT_FOUND')
