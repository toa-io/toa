# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.302](https://github.com/toa-io/toa/compare/v1.0.0-alpha.301...v1.0.0-alpha.302) (2026-09-11)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

### Features

* **convergence:** deployments of one context converge ([8a70343](https://github.com/toa-io/toa/commit/8a70343cf6953aab58d4a25bac215508ff8d9a37))


# [1.0.0-alpha.298](https://github.com/toa-io/toa/compare/v1.0.0-alpha.297...v1.0.0-alpha.298) (2026-09-08)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.297](https://github.com/toa-io/toa/compare/v1.0.0-alpha.296...v1.0.0-alpha.297) (2026-09-08)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.296](https://github.com/toa-io/toa/compare/v1.0.0-alpha.295...v1.0.0-alpha.296) (2026-09-08)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.295](https://github.com/toa-io/toa/compare/v1.0.0-alpha.294...v1.0.0-alpha.295) (2026-09-07)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.294](https://github.com/toa-io/toa/compare/v1.0.0-alpha.293...v1.0.0-alpha.294) (2026-09-07)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

### Bug Fixes

* **runtime:** the cadence extension is installed with the runtime ([a13c585](https://github.com/toa-io/toa/commit/a13c58530ece55fa618ae4bd2186eabf41625978))


# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

### Features

* **cli:** the deployment library is a peer, and the binary is the CLI's ([a923f81](https://github.com/toa-io/toa/commit/a923f8173a55ed1c091213a7c7db1863ca1d0ba6))
* **definitions:** an operation is read from its source ([56ee048](https://github.com/toa-io/toa/commit/56ee0485e7f00fa52bd9de9a4b0c780127b3ee87))
* **definitions:** the version of Toa is the definitions package's ([3d0272e](https://github.com/toa-io/toa/commit/3d0272ea0ab862f4b6c2e58a2f003f92d0f8a87f))


# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.290](https://github.com/toa-io/toa/compare/v1.0.0-alpha.289...v1.0.0-alpha.290) (2026-09-07)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

**Note:** Version bump only for package @toa.io/runtime
