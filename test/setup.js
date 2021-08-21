'use strict'

jest.spyOn(global.console, 'debug').mockImplementation(() => jest.fn())
jest.spyOn(global.console, 'info').mockImplementation(() => jest.fn())
jest.spyOn(global.console, 'warn').mockImplementation(() => jest.fn())

if (process.env.NODE_ENV === 'local') jest.setTimeout(30000)
