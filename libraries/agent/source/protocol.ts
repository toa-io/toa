export type Protocol = 'h1' | 'h2c'

/**
 * The transport to speak to the server under test. `h2c` is cleartext HTTP/2, which is
 * what a gateway configured for it serves; the cucumber profile sets this to match.
 */
export const PROTOCOL: Protocol = process.env.TOA_AGENT_PROTOCOL === 'h2c' ? 'h2c' : 'h1'
