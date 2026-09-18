import { deliver } from './lib/deliver.ts'
import type { Context, PushInput } from '../types/index.d.ts'

export async function effect(
  { key, event, data }: PushInput,
  context: Context
): Promise<void> {
  deliver(context, key, { event, data })
}
