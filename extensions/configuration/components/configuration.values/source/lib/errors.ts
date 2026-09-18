export class UnknownComponentError extends Error {
  public readonly code = 'UNKNOWN_COMPONENT'

  public constructor(component: string) {
    super(`Component '${component}' is not configured`)
  }
}
