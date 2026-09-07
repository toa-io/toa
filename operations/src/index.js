export * as deployment from './deployment/index.js'

// what conceals a secret in the cluster a deployment goes to; the CLI needs no package of its own for it
export * as kubernetes from '@toa.io/kubernetes'
