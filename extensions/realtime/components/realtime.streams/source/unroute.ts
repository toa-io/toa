import type { Context, UnrouteInput } from '../types/index.d.ts'

export async function effect(input: UnrouteInput, context: Context): Promise<null> {
  await context.state.routes.unroute(input)

  return null
}
