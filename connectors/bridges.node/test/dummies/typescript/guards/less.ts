export function guard (state: { a: number, b: number }): boolean {
  return state.b > state.a
}
