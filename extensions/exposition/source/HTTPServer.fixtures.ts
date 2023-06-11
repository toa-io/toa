import type { Express } from 'express'
import type { CorsOptions } from 'cors'
import type * as http from 'node:http'

const server = {
  close: jest.fn()
} as unknown as jest.Mock<http.Server>

const app = {
  enable: jest.fn(),
  disable: jest.fn(),
  use: jest.fn(),
  listen: jest.fn(() => server)
} as unknown as jest.Mock<Express>

export const express = jest.fn(() => app)

export const cors = jest.fn((_: CorsOptions) => () => undefined)
