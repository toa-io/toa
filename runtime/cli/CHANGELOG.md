# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.303](https://github.com/toa-io/toa/compare/v1.0.0-alpha.302...v1.0.0-alpha.303) (2026-09-12)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.302](https://github.com/toa-io/toa/compare/v1.0.0-alpha.301...v1.0.0-alpha.302) (2026-09-11)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

### Bug Fixes

* address review of the environment fallback chain ([900160b](https://github.com/toa-io/toa/commit/900160b60b6a017868aae84310730b91ea7d26f0))

### Features

* **norm:** an environment name may fall back along a colon-separated chain ([a267c1c](https://github.com/toa-io/toa/commit/a267c1caae816a75ada8352d5361b99817c72eb1))
* **operations:** an evicted component is given its environment and configuration ([6cf7890](https://github.com/toa-io/toa/commit/6cf7890a632a2185d2b7d9790890a04187e5a897))


# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

* feat(boot)!: a process is a thing, and an extension may keep something in one ([528d6cd](https://github.com/toa-io/toa/commit/528d6cdd307b45a6c30b6a184d7e06b3328cecf8))

### Features

* **cli:** generate env for listed components and services ([b830613](https://github.com/toa-io/toa/commit/b830613ae2a0443bf8e72a353ffb6f2efaa72fb5))
* **cli:** run several extension services with `toa serve` ([e8eee8c](https://github.com/toa-io/toa/commit/e8eee8c8b7ed2c82bdf935f2f2065d7b1e72aab8))
* **cli:** toa serve refuses a listed service that is off in this environment ([f3aecef](https://github.com/toa-io/toa/commit/f3aecef7b9809a9e6088ed2eb0864f9821d8c465))
* **cli:** write types for components this context does not deploy ([964a3b9](https://github.com/toa-io/toa/commit/964a3b9d60fd6aa3a3b81a0bd024aa8aca95f179))
* **core:** a call may name the process it goes to, and wait for a set time ([7d8adb2](https://github.com/toa-io/toa/commit/7d8adb2772a95ff45ae5374efdedfb5a857fbbe9))

### BREAKING CHANGES

* a composition booted directly has no readiness probe. Readiness is
  the process's, and a composition is not a process. `stage.workload` boots one where a
  suite needs it.


# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

### Bug Fixes

* **cli:** a process on its way out keeps its telemetry ([eb33bd4](https://github.com/toa-io/toa/commit/eb33bd4fd6a1beabf2a2535cdd0901037a4587f7))

### Features

* **cli:** a region's broker topology is exported ([697ca6c](https://github.com/toa-io/toa/commit/697ca6ca08091a79a23c59ffe5ef5d9d462dbb8a))


# [1.0.0-alpha.298](https://github.com/toa-io/toa/compare/v1.0.0-alpha.297...v1.0.0-alpha.298) (2026-09-08)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.297](https://github.com/toa-io/toa/compare/v1.0.0-alpha.296...v1.0.0-alpha.297) (2026-09-08)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.296](https://github.com/toa-io/toa/compare/v1.0.0-alpha.295...v1.0.0-alpha.296) (2026-09-08)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.295](https://github.com/toa-io/toa/compare/v1.0.0-alpha.294...v1.0.0-alpha.295) (2026-09-07)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.294](https://github.com/toa-io/toa/compare/v1.0.0-alpha.293...v1.0.0-alpha.294) (2026-09-07)

### Bug Fixes

* **cli:** `toa npm` reads back through the range npm wrote ([8af4c53](https://github.com/toa-io/toa/commit/8af4c536fb0bf7f122a98d864d903f580ad832ba))


# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

### Features

* **cli:** `toa npm` installs what a Context's components declare ([97196f0](https://github.com/toa-io/toa/commit/97196f00feb1b422c6f7ac3a4ddcb47a5ba60d71))


# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

### Features

* **cli:** the deployment library is a peer, and the binary is the CLI's ([a923f81](https://github.com/toa-io/toa/commit/a923f8173a55ed1c091213a7c7db1863ca1d0ba6))
* **definitions:** an operation is read from its source ([56ee048](https://github.com/toa-io/toa/commit/56ee0485e7f00fa52bd9de9a4b0c780127b3ee87))
* **definitions:** the version of Toa is the definitions package's ([3d0272e](https://github.com/toa-io/toa/commit/3d0272ea0ab862f4b6c2e58a2f003f92d0f8a87f))
* **definitions:** what a package declares is read from one package ([7052341](https://github.com/toa-io/toa/commit/70523411b5d9e2b204c999aa02365173f3bb518d))
* **norm:** a package's definition is read by one resolver ([bffd41c](https://github.com/toa-io/toa/commit/bffd41c8d18c42786b0bf321623088b9dabc4724))


# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.290](https://github.com/toa-io/toa/compare/v1.0.0-alpha.289...v1.0.0-alpha.290) (2026-09-07)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

**Note:** Version bump only for package @toa.io/cli
