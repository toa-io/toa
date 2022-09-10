'use strict'

const tap = require('tap')
const stage = require('@toa.io/userland/stage')

/** @type {toa.samples.replay.Replay} */
const replay = async (suite) => {
  const remotes = await connect(suite)

  const results = await tap.test('Replay', async (test) => {
    for (const [component, set] of Object.entries(suite)) {
      const remote = remotes[component]

      for (const [operation, samples] of Object.entries(set)) {
        let n = 0

        for (const sample of samples) {
          n++

          const { title, request, ...rest } = sample

          request.sample = rest

          await test.test(title ?? 'Sample ' + n, async (test) => {
            let exception

            try {
              await remote.invoke(operation, request)
            } catch (e) {
              exception = e
            }

            test.equal(exception, undefined, exception?.message, EXTRA)
            test.end()
          })
        }
      }
    }

    test.end()
  })

  return results.ok === true
}

/**
 * @param {toa.samples.Suite} suite
 * @return {Promise<void>}
 */
const connect = async (suite) => {
  const remotes = {}
  const promises = Object.keys(suite).map((id) => stage.remote(id))
  const list = await Promise.all(promises)

  for (const remote of list) {
    remotes[remote.locator.id] = remote
  }

  return remotes
}

const EXTRA = { diagnostic: process.env.TOA_DEBUG === '1' }

exports.replay = replay
