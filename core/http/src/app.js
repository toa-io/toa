'use strict'

const path = require('path')

const express = require('express')
const favicon = require('serve-favicon')

function app () {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json())
  app.use(favicon(path.resolve(__dirname, '../assets/favicon.png')))
  app.set('json spaces', 2)

  return app
}

exports.app = app
