export const ERR_NOT_FOUND = new (class NotFoundError extends Error {
  public readonly code = 'NOT_FOUND'
})()
