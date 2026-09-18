import { deliver } from './lib/deliver.ts'
import type { Context, DispatchInput } from '../types/index.d.ts'

export async function effect(
  { event, data }: DispatchInput,
  context: Context
): Promise<void> {
  const payload = (data ?? {}) as Record<string, unknown>

  for (const [key, fitted] of context.state.routes.match(event, payload))
    deliver(context, key, { event, data: fitted })
}
