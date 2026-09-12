import { hash } from 'node:crypto'

/**
 * The tag of a reply, which is the body it holds: a client that sends it back in `if-none-match`
 * already has this reply and is told so, whatever the reply carries.
 *
 * `if-match` is another matter — it carries the `VERSION` a client read in a body, which is what
 * an operation refuses a stale write by. See `documentation/cache.md`.
 */
export function etag(body: Buffer): string {
  return `"${hash('sha1', body, 'base64url')}"`
}

/** Whether the tag a client sent is this one, strong or weak. */
export function same(sent: string, tag: string): boolean {
  return sent === tag || sent === 'W/' + tag
}

/**
 * Whether a client may keep this reply. One it may not keep is one it can never send back to be
 * validated, so it is answered without a tag and the body is never hashed for one.
 */
export function kept(control: number | string | string[] | undefined): boolean {
  return control === undefined || !NO_STORE.test(String(control))
}

const NO_STORE = /\bno-store\b/i
