'use strict'

const tap = require('tap')
const stage = require('@toa.io/userland/stage')

/** @type {toa.samples.replay.Replay} */
const replay = async (suite) => {
  const { autonomous, components } = suite
  const remotes = await connect(components)

  const results = await tap.test('Replay suite', async (test) => {
    for (const [id, component] of Object.entries(components)) {
      await test.test(id, async (test) => {
        const remote = remotes[id]

        for (const [operation, samples] of Object.entries(component.operations)) {
          test.test(operation, async (test) => {
            let n = 0

            for (const sample of samples) {
              n++

              const { title, request, ...rest } = sample

              request.sample = rest
              request.sample.autonomous = autonomous

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

            test.end()
          })
        }

        test.end()
      })
    }

    test.end()
  })

  return results.ok === true
}

/**
 * @param {toa.samples.Components} components
 * @return {Promise<void>}
 */
const connect = async (components) => {
  const remotes = {}
  const promises = Object.keys(components).map((id) => stage.remote(id))
  const list = await Promise.all(promises)

  for (const remote of list) remotes[remote.locator.id] = remote

  return remotes
}

const EXTRA = { diagnostic: process.env.TOA_DEBUG === '1' }

exports.replay = replay
