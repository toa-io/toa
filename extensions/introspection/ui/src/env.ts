import { defineEnvVars } from '@sveltejs/kit/env'

export const variables = defineEnvVars({
  PUBLIC_APPLE_CLIENT_ID: { public: true, static: true, schema: (value) => value },
  PUBLIC_GOOGLE_CLIENT_ID: { public: true, static: true, schema: (value) => value },
})
