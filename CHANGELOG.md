# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/toa





# [1.0.0-alpha.290](https://github.com/toa-io/toa/compare/v1.0.0-alpha.289...v1.0.0-alpha.290) (2026-09-07)

* fix(operations)!: an image starts as root again ([9eb0db7](https://github.com/toa-io/toa/commit/9eb0db75e3d02098fe75710280e8e15e63b73d57))
* The runtime's environment is not a component's (#1070), closes [#1070](https://github.com/toa-io/toa/issues/1070)

### Bug Fixes

* **bindings.amqp:** a lost connection is restored again, with comq 0.16.1 ([9002d21](https://github.com/toa-io/toa/commit/9002d2195306decad9ad02c15f195d89df570f57))
* **core:** a connection that crosses a teardown is taken down with it ([1e44f0d](https://github.com/toa-io/toa/commit/1e44f0dddbf90ed7ad5c2086ce6fe30aa7317c90))

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.
* an image built by alpha.289 runs its composition as `node` and
  leaves the deployed environment readable under /proc; rebuild on 290. Nothing in
  a context or a manifest changes.


# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/toa





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

### Bug Fixes

* **boot:** a discovery belongs to the connection that made it ([48e1c8f](https://github.com/toa-io/toa/commit/48e1c8f668b1853134ae9fb2349c485e6da66c28))
* **cadence:** the scan reads what is owed, and nothing that is done ([581610e](https://github.com/toa-io/toa/commit/581610e87ac54c42491c882d5749ff3307700d35))

### Features

* **mongodb:** a migration says what it is doing ([a917a81](https://github.com/toa-io/toa/commit/a917a81fdc94eb23fd73182c0edf891e6b2df843))
