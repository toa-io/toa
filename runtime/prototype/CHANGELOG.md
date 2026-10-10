# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.327](https://github.com/toa-io/toa/compare/v1.0.0-alpha.326...v1.0.0-alpha.327) (2026-10-10)

### Bug Fixes

* **cli:** type the entity of a request to an effect ([6fa08d4](https://github.com/toa-io/toa/commit/6fa08d4ba407711a1d5fe6ed5921e485741e98f1))


# [1.0.0-alpha.323](https://github.com/toa-io/toa/compare/v1.0.0-alpha.322...v1.0.0-alpha.323) (2026-10-01)

### Bug Fixes

* **prototype:** convert the timestamps an assignment wrote as numbers ([1b0f3d6](https://github.com/toa-io/toa/commit/1b0f3d62c05ee8f621247cefcd6b56b358019470))


# [1.0.0-alpha.322](https://github.com/toa-io/toa/compare/v1.0.0-alpha.321...v1.0.0-alpha.322) (2026-09-29)

### Features

* **cli:** write the State a transition receives into the types ([0c8d0f7](https://github.com/toa-io/toa/commit/0c8d0f7a802df1f01ed16f120f75b5d791e5c8b4))


# [1.0.0-alpha.319](https://github.com/toa-io/toa/compare/v1.0.0-alpha.318...v1.0.0-alpha.319) (2026-09-27)

**Note:** Version bump only for package @toa.io/prototype





# [1.0.0-alpha.315](https://github.com/toa-io/toa/compare/v1.0.0-alpha.314...v1.0.0-alpha.315) (2026-09-23)

* feat(core)!: refuse a timeout or a signal on an ordinary call ([600b392](https://github.com/toa-io/toa/commit/600b392abfd8b24df1a151c26fb31a6f0c7ccd41))

### BREAKING CHANGES

* a call to a stateless operation that names a `timeout` or a
  `signal` is refused, where it used to be abandoned at its deadline.


# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

**Note:** Version bump only for package @toa.io/prototype





# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

**Note:** Version bump only for package @toa.io/prototype





# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

### Features

* **core:** a record carries the region that wrote it ([13ed187](https://github.com/toa-io/toa/commit/13ed187604f06dec66feec2e26ccf9dae30bb048))
* **core:** every system property is required ([52c468a](https://github.com/toa-io/toa/commit/52c468aacb03d0347a0e044f6bd76677bdd6af36))


# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

**Note:** Version bump only for package @toa.io/prototype
