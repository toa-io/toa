'use strict'

jest.spyOn(global.console, 'debug').mockImplementation(() => jest.fn())
jest.spyOn(global.console, 'info').mockImplementation(() => jest.fn())
jest.spyOn(global.console, 'warn').mockImplementation(() => jest.fn())
