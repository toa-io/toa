export async function computation () {
  return new (class KnownError extends Error {
    code = 'KNOWN'
    message = 'declared'
  })()
}
