'use strict'

delete process.env.TOA_ENV
global.TOA_INTEGRATION_OMIT_EMISSION = true
jest.setTimeout(60001)
