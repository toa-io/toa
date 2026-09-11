export async function effect(input, context) {
  return await context.storages[input.storage].get(input.path, {
    range: input.range,
    agent: input.agent
  })
}
