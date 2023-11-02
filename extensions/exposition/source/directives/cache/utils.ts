export const SAFE_METHODS = ['GET', 'OPTIONS', 'HEAD']

export const isSafeMethod = (method: string): boolean => SAFE_METHODS.includes(method)
