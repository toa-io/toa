export function effect(input, context) {
  return context.storages[input.storage].delete(input.path)
}
