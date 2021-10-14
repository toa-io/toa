'use strict'

const { Connector } = require('@kookaburra/core')

class Resources extends Connector {
  #broadcast
  #create
  #remotes = {}

  constructor (server, broadcast, create) {
    super()

    this.#broadcast = broadcast
    this.#create = create

    this.depends(server)
    this.depends(broadcast)
  }

  async connection () {
    await this.#broadcast.receive('expose', (definition) => this.#expose(definition))
    await this.#broadcast.send('ping', {})
  }

  async #expose ({ domain, name, resources }) {
    if (this.#remotes[domain] === undefined) this.#remotes[domain] = {}

    if (this.#remotes[domain][name] === undefined) {
      this.#remotes[domain][name] = (async () => {
        const remote = await this.#create(domain, name, resources)

        await remote.connect()

        this.depends(remote)

        return remote
      })()
    } else (await this.#remotes[domain][name]).expose(resources)
  }
}

exports.Resources = Resources
