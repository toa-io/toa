export async function computation (key, context) {
  return context.state.values.get(key)
}
