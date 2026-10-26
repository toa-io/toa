// what a caller the gateway verified sent, written as that identity's
export async function effect(input, context) {
  return await context.chronicles.write(input, input.identity)
}
