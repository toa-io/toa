'use strict'

const assert = require('node:assert')
const { setTimeout } = require('node:timers/promises')
const { Given, Then, After } = require('@cucumber/cucumber')
const { PubSub } = require('@google-cloud/pubsub')
const { parse } = require('@toa.io/yaml')
const { match } = require('@toa.io/generic')

Given('the PubSub subscriber `{word}` for topic `{word}` is running',
  /**
   * @param {string} name
   * @param {string} topicName
   * @this {toa.features.Context}
   */
  async function(name, topicName) {
    const pubsub = new PubSub({ projectId: 'toa-test', apiEndpoint: 'localhost:8085' })

    await pubsub.createTopic(topicName).catch(noop)
    await pubsub.topic(topicName).createSubscription(name).catch(noop)

    const subscription = pubsub.subscription(name)

    this.pubsub ??= {}
    this.pubsub[name] = { subscription, messages: [] }

    subscription.on('message', (message) => {
      const object = JSON.parse(message.data.toString())

      this.pubsub[name].messages.push(object)

      message.ack()
    })
  })

Then('the PubSub subscriber `{word}` has received a message:',
  /**
   * @param {string} name
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function(name, yaml) {
    await setTimeout(100)

    assert(name in this.pubsub, `Subscriber ${name} not found`)

    const expected = parse(yaml)
    const matches = this.pubsub[name].messages.some((message) => match(message, expected))

    assert.equal(matches, true, 'Message not found')
  })

After(async function() {
  for (const name in this.pubsub) {
    const { subscription } = this.pubsub[name]

    await subscription.removeAllListeners()
    await subscription.delete()
  }
})

const noop = () => undefined
