export { manifest } from './manifest.js'
export { components } from './components.js'
export { installs } from './packages.js'
export { deployment, image } from './deployment.js'
export { shortcuts } from './shortcuts.js'
export * from './const.js'
export * as schemas from './schemas.js'
export * as syntax from './syntax/index.js'

export type {
  Annotation,
  Bouncer,
  MCP as MCPAnnotation,
  OAuth,
  Protocol,
  RPC as RPCAnnotation
} from './Annotation.js'
