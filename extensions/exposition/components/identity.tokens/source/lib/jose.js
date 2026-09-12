/** @type {Promise<typeof import('jose')> | undefined} */
let loading

// resolved once: an import per call resolves the module again on every token
export const load = () => (loading ??= import('jose'))
