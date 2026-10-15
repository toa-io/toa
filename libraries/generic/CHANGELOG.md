# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.330](https://github.com/toa-io/toa/compare/v1.0.0-alpha.329...v1.0.0-alpha.330) (2026-10-15)

**Note:** Version bump only for package @toa.io/generic





# [1.0.0-alpha.329](https://github.com/toa-io/toa/compare/v1.0.0-alpha.328...v1.0.0-alpha.329) (2026-10-11)

* feat!: write a range of addresses as comq reads it ([b753690](https://github.com/toa-io/toa/commit/b75369061dee7e077b55190955d8cb358917a275))

### Bug Fixes

* include both ends of a range of addresses ([3be1f8a](https://github.com/toa-io/toa/commit/3be1f8a7a5c7e8e09d5fd3918c117876c56e7ec6))

### Features

* write every number of a range as wide as its end ([2f927a4](https://github.com/toa-io/toa/commit/2f927a4ce19af3243eabfffc914faba75495e2df))

### BREAKING CHANGES

* `{0-2}` is no longer a range. See migrations/328.md.


# [1.0.0-alpha.311](https://github.com/toa-io/toa/compare/v1.0.0-alpha.310...v1.0.0-alpha.311) (2026-09-17)

### Features

* read the scope of a process once, as it boots ([0d65de5](https://github.com/toa-io/toa/commit/0d65de58ffc655ff872b8e66f95c5609ada3370a))


# [1.0.0-alpha.310](https://github.com/toa-io/toa/compare/v1.0.0-alpha.309...v1.0.0-alpha.310) (2026-09-16)

**Note:** Version bump only for package @toa.io/generic





# [1.0.0-alpha.304](https://github.com/toa-io/toa/compare/v1.0.0-alpha.303...v1.0.0-alpha.304) (2026-09-13)

### Bug Fixes

* **generic:** escape the decimal point in the quantity expression ([a947232](https://github.com/toa-io/toa/commit/a9472327d37e7130bf69a700383bc5af129caf0f))


# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

### Features

* **norm:** an environment name may fall back along a colon-separated chain ([a267c1c](https://github.com/toa-io/toa/commit/a267c1caae816a75ada8352d5361b99817c72eb1))


# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

### Features

* **definitions:** the version of Toa is the definitions package's ([3d0272e](https://github.com/toa-io/toa/commit/3d0272ea0ab862f4b6c2e58a2f003f92d0f8a87f))


# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/generic





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.
