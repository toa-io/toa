import type { Context, RouteInput } from '../types/index.d.ts'

export async function effect(input: RouteInput, context: Context): Promise<Error | null> {
  return await context.state.routes.route(input)
}
