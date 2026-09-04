export const ERR_TOKEN = new (class TokenError extends Error {
  public readonly code = 'TOKEN'
  public override readonly message = 'Token is malformed or does not verify'
})()

export const ERR_TRUST = new (class TrustError extends Error {
  public readonly code = 'TRUST'
  public override readonly message = 'Issuer not trusted'
})()

export const ERR_RESPONSE = new (class ResponseError extends Error {
  public readonly code = 'RESPONSE'
  public override readonly message = 'Request to IDP failed'
})()

export const ERR_CONFIG = new (class ConfigError extends Error {
  public readonly code = 'CONFIG'
  public override readonly message = 'Invalid OpenID configuration'
})()

export const ERR_NO_TOKEN = new (class NoTokenError extends Error {
  public readonly code = 'NO_TOKEN'
  public override readonly message = 'No ID token received'
})()

export const ERR_ISS = new (class IssError extends Error {
  public readonly code = 'ISS'
  public override readonly message = 'Invalid issuer claim'
})()

export const ERR_SUB = new (class SubError extends Error {
  public readonly code = 'SUB'
  public override readonly message = 'Invalid subject claim'
})()

export const ERR_EXP = new (class ExpError extends Error {
  public readonly code = 'EXP'
  public override readonly message = 'Token does not have an expiration time'
})()

export const ERR_REPLAY = new (class ReplayError extends Error {
  public readonly code = 'REPLAY'
  public override readonly message = 'Token has already been used'
})()

export const ERR_CODE_NOT_ENABLED = new (class CodeNotEnabledError extends Error {
  public readonly code = 'CODE_NOT_ENABLED'
  public override readonly message = 'Authorization code flow is not configured'
})()

export const ERR_CODE_SCHEMA = new (class CodeSchemaError extends Error {
  public readonly code = 'CODE_SCHEMA'
  public override readonly message = 'Invalid code credentials'
})()
