import { Err } from 'error-value'

export const ERR_TRUST = new Err('TRUST', 'Issuer not trusted')
export const ERR_RESPONSE = new Err('RESPONSE', 'Request to IDP failed')
export const ERR_CONFIG = new Err('CONFIG', 'Invalid OpenID configuration')
export const ERR_NO_TOKEN = new Err('NO_TOKEN', 'No ID token received')
export const ERR_ISS = new Err('ISS', 'Invalid issuer claim')
export const ERR_SUB = new Err('SUB', 'Invalid subject claim')
export const ERR_EXP = new Err('EXP', 'Token does not have an expiration time')
export const ERR_REPLAY = new Err('REPLAY', 'Token has already been used')
export const ERR_CODE_NOT_SUPPORTED = new Err('CODE_NOT_SUPPORTED', 'Authorization code grant not supported')
export const ERR_CODE_PARAMETERS = new Err('CODE_PARAMETERS', 'Invalid authorization code parameters')
