export const request = (payload) => {
  return {
    input: { a: payload.a, b: payload.b, fail: payload.fail }
  }
}
