/**
 * What a call was, kept so that the same call arriving again is refused rather than made twice.
 *
 * Everything about it is core's, as the outbox row is: core builds it and hands it to the write,
 * and the storage commits it in the transaction the entity is committed in. Written only for a
 * call that changed something — an operation that refused, or that raised, leaves nothing, and a
 * call that arrives again after one of those is made again and refuses again.
 */
export interface Call {
  /** the identity of the request, which is the key it is refused on */
  id: string

  /** what the call answered, so that a duplicate of it is answered rather than refused */
  reply: object
}

/**
 * The read side of an inbox. What writes a record is the storage's own: it happens inside the
 * transaction the storage opened, which core never reaches into.
 */
export interface Inbox {
  /** what the call under this identity answered, or `null` where it was never made */
  recall(id: string): Promise<object | null>
}
