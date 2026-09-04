export async function computation () {
  return new (class SilentError extends Error {
    code = 'SILENT'
    message = 'never declared'
  })()
}
