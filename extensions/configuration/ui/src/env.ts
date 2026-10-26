import { defineEnvVars } from '@sveltejs/kit/env'

// an identity provider whose client is not set is not offered
const optional = (value: string | undefined) => value

export const variables = defineEnvVars({
  PUBLIC_APPLE_CLIENT_ID: { public: true, schema: optional },
  PUBLIC_GOOGLE_CLIENT_ID: { public: true, schema: optional },
})
