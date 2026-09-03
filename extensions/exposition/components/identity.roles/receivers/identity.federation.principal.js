/**
 * @param {{ identity: string }} payload
 */
export const request = (payload) => ({ input: { id: payload.identity } })
