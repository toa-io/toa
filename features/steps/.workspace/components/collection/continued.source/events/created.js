export const payload = (event) => {
  return { a: event.state.a, b: event.state.b, fail: event.state.fail }
}
