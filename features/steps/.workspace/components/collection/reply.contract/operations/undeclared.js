export async function computation () {
  return new (class OtherError extends Error {
    code = 'OTHER'
    message = 'undeclared'
  })()
}
