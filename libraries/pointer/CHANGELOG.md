# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.330](https://github.com/toa-io/toa/compare/v1.0.0-alpha.329...v1.0.0-alpha.330) (2026-10-15)

**Note:** Version bump only for package @toa.io/pointer





# [1.0.0-alpha.329](https://github.com/toa-io/toa/compare/v1.0.0-alpha.328...v1.0.0-alpha.329) (2026-10-11)

* feat!: write a range of addresses as comq reads it ([b753690](https://github.com/toa-io/toa/commit/b75369061dee7e077b55190955d8cb358917a275))

### Bug Fixes

* include both ends of a range of addresses ([3be1f8a](https://github.com/toa-io/toa/commit/3be1f8a7a5c7e8e09d5fd3918c117876c56e7ec6))

### BREAKING CHANGES

* `{0-2}` is no longer a range. See migrations/328.md.


# [1.0.0-alpha.327](https://github.com/toa-io/toa/compare/v1.0.0-alpha.326...v1.0.0-alpha.327) (2026-10-10)

### Features

* name a component without a namespace by its name ([abcdd9c](https://github.com/toa-io/toa/commit/abcdd9c9a3d3c5c1c68b74544791848e59a7e158))


# [1.0.0-alpha.326](https://github.com/toa-io/toa/compare/v1.0.0-alpha.325...v1.0.0-alpha.326) (2026-10-06)

**Note:** Version bump only for package @toa.io/pointer





# [1.0.0-alpha.311](https://github.com/toa-io/toa/compare/v1.0.0-alpha.310...v1.0.0-alpha.311) (2026-09-17)

**Note:** Version bump only for package @toa.io/pointer





# [1.0.0-alpha.310](https://github.com/toa-io/toa/compare/v1.0.0-alpha.309...v1.0.0-alpha.310) (2026-09-16)

**Note:** Version bump only for package @toa.io/pointer





# [1.0.0-alpha.304](https://github.com/toa-io/toa/compare/v1.0.0-alpha.303...v1.0.0-alpha.304) (2026-09-13)

**Note:** Version bump only for package @toa.io/pointer





# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

**Note:** Version bump only for package @toa.io/pointer





# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

**Note:** Version bump only for package @toa.io/pointer





# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

**Note:** Version bump only for package @toa.io/pointer





# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

**Note:** Version bump only for package @toa.io/pointer





# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/pointer





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

**Note:** Version bump only for package @toa.io/pointer
