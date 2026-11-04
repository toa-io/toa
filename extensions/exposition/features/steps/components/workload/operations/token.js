/** What an application's component does to call another as itself. */
export async function effect(input, context) {
  return await context.remote.identity.federation.issue({ input })
}
