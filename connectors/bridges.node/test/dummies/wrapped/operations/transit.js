const wrap = (fn) => fn

// what the value is cannot be read from here, so the manifest declares the scope
export const transition = wrap((input, object) => ({ input, object }))
