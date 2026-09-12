/**
 * An observation that writes through another operation. It is safe itself — it modifies nothing of
 * what it acquired — and the chain it starts is not. See `features/readonly.feature`.
 */
export async function observation(input, object, context) {
  return await context.local.terminate({ query: { id: object.id } })
}
