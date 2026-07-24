class Computation {
  ok

  mount (ctx) {
    this.ok = ctx.state.ok
  }

  execute() {
    return this.ok
  }
}

module.exports = { Computation }
