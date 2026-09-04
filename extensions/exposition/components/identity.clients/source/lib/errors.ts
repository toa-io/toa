export const ERR_UNKNOWN_CLIENT = new (class UnknownClientError extends Error {
  public readonly code = 'UNKNOWN_CLIENT'
  public override readonly message = 'No such client'
})()
