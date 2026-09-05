import type { Context, Entity } from '../types/index.js'

/**
 * The `system` Role is granted where the credentials are created, before the reply that mints
 * a Token from them — the event that carries the same grant lands after it.
 */
export async function principal (credential: Entity, context: Context): Promise<void> {
  const configured = context.configuration.principal

  if (configured === undefined ||
    configured.authority !== credential.authority ||
    configured.iss !== credential.iss ||
    configured.sub !== credential.sub)
    return

  await context.remote.identity.roles.principal({ input: { id: credential.identity } })
}
