'use strict'

const { Given } = require('@cucumber/cucumber')

// events emitted while a receiver isn't composed pile up in its durable queue and are
// delivered in a burst the next time it starts, so a scenario asserting on what the
// receiver has processed has to start from an empty queue
Given('the {component} event queues are empty',
  /**
   * @param {string} id
   */
  async function (id) {
    const queues = await request('/queues')
    const suffix = '..' + id

    for (const { name } of queues)
      if (name.endsWith(suffix))
        await request(`/queues/%2F/${encodeURIComponent(name)}/contents`, 'DELETE')
  })

/**
 * @param {string} path
 * @param {string} [method]
 * @returns {Promise<any>}
 */
async function request (path, method = 'GET') {
  const response = await fetch(MANAGEMENT + path, { method, headers: { authorization: AUTHORIZATION } })

  if (!response.ok)
    throw new Error(`RabbitMQ management ${method} ${path} responded with ${response.status}`)

  if (method === 'GET') return response.json()
}

const MANAGEMENT = 'http://localhost:15672/api'
const AUTHORIZATION = 'Basic ' + Buffer.from('developer:secret').toString('base64')
