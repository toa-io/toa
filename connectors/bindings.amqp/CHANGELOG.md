# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.318](https://github.com/toa-io/toa/compare/v1.0.0-alpha.317...v1.0.0-alpha.318) (2026-09-23)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.317](https://github.com/toa-io/toa/compare/v1.0.0-alpha.316...v1.0.0-alpha.317) (2026-09-23)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.316](https://github.com/toa-io/toa/compare/v1.0.0-alpha.315...v1.0.0-alpha.316) (2026-09-23)

### Bug Fixes

* **bindings.amqp:** comq 0.24.1 ([720da0c](https://github.com/toa-io/toa/commit/720da0c3a4cddacd95bec8ace71008101d36a314)), closes [toa-io/comq#305](https://github.com/toa-io/comq/issues/305)


# [1.0.0-alpha.315](https://github.com/toa-io/toa/compare/v1.0.0-alpha.314...v1.0.0-alpha.315) (2026-09-23)

* feat(core)!: refuse a timeout or a signal on an ordinary call ([600b392](https://github.com/toa-io/toa/commit/600b392abfd8b24df1a151c26fb31a6f0c7ccd41))

### BREAKING CHANGES

* a call to a stateless operation that names a `timeout` or a
  `signal` is refused, where it used to be abandoned at its deadline.


# [1.0.0-alpha.314](https://github.com/toa-io/toa/compare/v1.0.0-alpha.313...v1.0.0-alpha.314) (2026-09-19)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.313](https://github.com/toa-io/toa/compare/v1.0.0-alpha.312...v1.0.0-alpha.313) (2026-09-18)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.312](https://github.com/toa-io/toa/compare/v1.0.0-alpha.311...v1.0.0-alpha.312) (2026-09-18)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.311](https://github.com/toa-io/toa/compare/v1.0.0-alpha.310...v1.0.0-alpha.311) (2026-09-17)

### Features

* begin exchange and queue names with the scope under a suffix ([af3752d](https://github.com/toa-io/toa/commit/af3752d1fcb8a3b42d9071dfbdb3c4800590d3d5))


# [1.0.0-alpha.310](https://github.com/toa-io/toa/compare/v1.0.0-alpha.309...v1.0.0-alpha.310) (2026-09-16)

### Features

* give a component one task queue ([4abb6b2](https://github.com/toa-io/toa/commit/4abb6b2eee253a3b4dc31d001bb05521d83fdf9d))


# [1.0.0-alpha.309](https://github.com/toa-io/toa/compare/v1.0.0-alpha.308...v1.0.0-alpha.309) (2026-09-16)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.308](https://github.com/toa-io/toa/compare/v1.0.0-alpha.307...v1.0.0-alpha.308) (2026-09-15)

### Bug Fixes

* **bindings.amqp:** close a connection that lands after its disposal ([d6fcdb1](https://github.com/toa-io/toa/commit/d6fcdb1a38918145680a3fdde89ed3b40afcb2d7))


# [1.0.0-alpha.307](https://github.com/toa-io/toa/compare/v1.0.0-alpha.306...v1.0.0-alpha.307) (2026-09-15)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.306](https://github.com/toa-io/toa/compare/v1.0.0-alpha.305...v1.0.0-alpha.306) (2026-09-14)

### Features

* **bindings:** count what a process is handling ([2298a97](https://github.com/toa-io/toa/commit/2298a973ca80143910e988da64949a51eb1a9101))


# [1.0.0-alpha.305](https://github.com/toa-io/toa/compare/v1.0.0-alpha.304...v1.0.0-alpha.305) (2026-09-13)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.304](https://github.com/toa-io/toa/compare/v1.0.0-alpha.303...v1.0.0-alpha.304) (2026-09-13)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.303](https://github.com/toa-io/toa/compare/v1.0.0-alpha.302...v1.0.0-alpha.303) (2026-09-12)

### Features

* **metrics:** count what no span reaches ([efabf89](https://github.com/toa-io/toa/commit/efabf89e78f98a604bb939f476a937fc9ee106b3))

### Performance Improvements

* **bindings.amqp:** answer an output as bytes where its caller reads them ([96be109](https://github.com/toa-io/toa/commit/96be1096abaaf6d1d01d1a1b62354a656bbb9f20))
* **bindings.amqp:** depend on comq 0.20.1, which sends a message without delay ([4e34c3b](https://github.com/toa-io/toa/commit/4e34c3ba51d1a086b5c82eeaa78107ce628e4494))


# [1.0.0-alpha.302](https://github.com/toa-io/toa/compare/v1.0.0-alpha.301...v1.0.0-alpha.302) (2026-09-11)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

### Features

* **core:** a call may name the process it goes to, and wait for a set time ([7d8adb2](https://github.com/toa-io/toa/commit/7d8adb2772a95ff45ae5374efdedfb5a857fbbe9))


# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

### Bug Fixes

* **bindings.amqp:** work with nobody waiting for it survives failing ([e70dd59](https://github.com/toa-io/toa/commit/e70dd59fc277623928ca132e2b911c5c4f441ffc))

### Features

* **bindings.amqp:** a binding carries a channel, addressed by label ([17cf178](https://github.com/toa-io/toa/commit/17cf1782d1c47d033c02f99947b766eb9d45df75))
* **bindings.amqp:** a message that can never be processed is kept at once ([5dd9e4b](https://github.com/toa-io/toa/commit/5dd9e4b1d9403a324eac5b64146d5f1170f70e95))
* **cli:** a region's broker topology is exported ([697ca6c](https://github.com/toa-io/toa/commit/697ca6ca08091a79a23c59ffe5ef5d9d462dbb8a))


# [1.0.0-alpha.298](https://github.com/toa-io/toa/compare/v1.0.0-alpha.297...v1.0.0-alpha.298) (2026-09-08)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.297](https://github.com/toa-io/toa/compare/v1.0.0-alpha.296...v1.0.0-alpha.297) (2026-09-08)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.296](https://github.com/toa-io/toa/compare/v1.0.0-alpha.295...v1.0.0-alpha.296) (2026-09-08)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.295](https://github.com/toa-io/toa/compare/v1.0.0-alpha.294...v1.0.0-alpha.295) (2026-09-07)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.294](https://github.com/toa-io/toa/compare/v1.0.0-alpha.293...v1.0.0-alpha.294) (2026-09-07)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

### Features

* **definitions:** what a package declares is read from one package ([7052341](https://github.com/toa-io/toa/commit/70523411b5d9e2b204c999aa02365173f3bb518d))


# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/bindings.amqp





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

**Note:** Version bump only for package @toa.io/bindings.amqp
