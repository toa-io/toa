export async function computation() {
  return new (class extends Error {
    code = 'KNOWN'
  })()
}
