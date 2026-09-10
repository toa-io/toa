export function transition(_input, _object) {
  return new (class RefusedError extends Error {
    code = 'REFUSED'
    message = 'refused'
  })()
}
