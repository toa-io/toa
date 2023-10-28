import { type Call } from '@toa.io/types'

export async function effect (input: Identity, context: Context): Promise<void> {
  await context.local.transit({ input: { identity: input.id, role: 'system' } })
}

interface Identity {
  id: string
}

export interface Context {
  local: {
    transit: Call<void, TransitInput>
  }
}

interface TransitInput {
  identity: string
  role: string
}
