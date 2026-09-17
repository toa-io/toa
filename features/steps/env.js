import { Given, After, Before } from '@cucumber/cucumber'
import { load as parse } from 'js-yaml'
import { environment } from '@toa.io/generic'

Given('an environment variable {token} is set to {string}', setEnv)

Given('an environment variable {token} is set to:', function (name, yaml) {
  const value = parse(yaml)

  setEnv.call(this, name, JSON.stringify(value))
})

Given(
  '{token} is set to {string} in `process.env`',
  /**
   * What a process does for the processes it starts, rather than what it was started with: the
   * store is left alone, and restored after the scenario along with `process.env`.
   *
   * @param {string} name
   * @param {string} value
   * @this {toa.features.Context}
   */
  function (name, value) {
    this.env.push([name, environment.get(name)])

    process.env[name] = value
  }
)

function setEnv(name, value) {
  // what it was, not that it was set: a scenario overriding one the suite relies on
  // must leave it as it found it
  this.env.push([name, environment.get(name)])

  environment.set(name, value)
}

Before(
  /**
   * @this {toa.features.Context}
   */
  function () {
    this.env = []
  }
)

After(
  /**
   * @this {toa.features.Context}
   */
  function () {
    // in reverse, so a variable set more than once comes back to what it was before the first
    for (const [name, value] of this.env.reverse())
      if (value === undefined) environment.delete(name)
      else environment.set(name, value)
  }
)
