'use strict'

const { Given, When, Then } = require('@cucumber/cucumber')
const { resolve } = require('node:path')
const { DockerComposeEnvironment, Wait } = require("testcontainers")
const ROOT = resolve(__dirname, '../../')
const composeFilePath = ROOT;
const composeFile = "docker-compose.yaml";

let environment

Given('I have a docker container {component}',
  /**
   * 
   * @param {string} container 
   * @return {Promise<void>}
   */
  async function (container) {
    environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
      .withWaitStrategy('mongodb-restart', Wait.forLogMessage('Waiting for connections'))
      .up(['mongodb-restart'])    
  })

Then('docker container {component} should had new connection',
  /**
   * 
   * @param {string} container 
   * @return {Promise<void>}
   */
  async function (container) {
    console.dir(environment.getContainer('mongodb-restart'))
  })

When('I stop docker container {component}',
  /**
   * 
   * @param {string} container 
   * @return {Promise<void>}
   */
  async function (container) {
    await environment.down({ timeout: 1000 })
  })

When('I start docker container {component}',
  /**
   * 
   * @param {string} container 
   * @return {Promise<void>}
   */
  async function (container) {
    environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
      .withWaitStrategy('mongodb-restart', Wait.forLogMessage('Waiting for connections'))
      .up(['mongodb-restart'])
  })