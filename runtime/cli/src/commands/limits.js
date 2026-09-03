import { limits } from '../handlers/limits.js'

export const command = 'limits'
export const desc = 'Get resource limits for all pods in the current Kubernetes context'

export { limits as handler }
