import { Before, When, Then } from '@cucumber/cucumber'
import { Agent } from '@toa.io/agent'

// what the steps of one scenario share
export interface World {
  agent: Agent
}

Before(function (this: World) {
  this.agent = new Agent('http://localhost:8000')
})

When('the request is sent:', async function (this: World, text: string) {
  await this.agent.request(text)
})

Then('the response is received:', function (this: World, text: string) {
  this.agent.responseIncludes(text)
})
