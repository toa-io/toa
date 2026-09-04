export function request (payload: { id: string }): { query: { id: string } } {
  return { query: { id: payload.id } }
}
