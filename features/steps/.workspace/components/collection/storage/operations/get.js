export function computation (input, context) {
  return context.storages[input.storage].get(input.path)
}
