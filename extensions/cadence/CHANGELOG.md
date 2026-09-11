# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

**Note:** Version bump only for package @toa.io/extensions.cadence





# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

### Bug Fixes

* **extensions:** what a factory remembers does not outlive the tree it was made for ([dd36631](https://github.com/toa-io/toa/commit/dd3663160f500eadfb701bf840ef3741a2d075f0))

### Features

* **core:** a call carries what it is, and a chain of them carries it down ([ebd7769](https://github.com/toa-io/toa/commit/ebd776984a79adb9bf4a97b680128be1efab856f))
* **core:** a call may name the process it goes to, and wait for a set time ([7d8adb2](https://github.com/toa-io/toa/commit/7d8adb2772a95ff45ae5374efdedfb5a857fbbe9))


# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

### Bug Fixes

* **cadence:** a delayed call is settled by its outcome, not by the attempt ([ac1c54b](https://github.com/toa-io/toa/commit/ac1c54b878e2705d81ce8365cf2f13e1d5ce0e83))

### Features

* **cadence:** a delayed call is made by the chain that asked for it ([0a38ac6](https://github.com/toa-io/toa/commit/0a38ac672516783644e27085e9372bcff6116d1a))
* **cadence:** a deployment makes the calls of the region it is ([60736e5](https://github.com/toa-io/toa/commit/60736e5a56a7f96648c8a3d1ddc1f4c6c8197b5e))
* **core:** a record carries the region that wrote it ([13ed187](https://github.com/toa-io/toa/commit/13ed187604f06dec66feec2e26ccf9dae30bb048))
* **core:** every system property is required ([52c468a](https://github.com/toa-io/toa/commit/52c468aacb03d0347a0e044f6bd76677bdd6af36))


# [1.0.0-alpha.298](https://github.com/toa-io/toa/compare/v1.0.0-alpha.297...v1.0.0-alpha.298) (2026-09-08)

**Note:** Version bump only for package @toa.io/extensions.cadence





# [1.0.0-alpha.297](https://github.com/toa-io/toa/compare/v1.0.0-alpha.296...v1.0.0-alpha.297) (2026-09-08)

**Note:** Version bump only for package @toa.io/extensions.cadence





# [1.0.0-alpha.296](https://github.com/toa-io/toa/compare/v1.0.0-alpha.295...v1.0.0-alpha.296) (2026-09-08)

**Note:** Version bump only for package @toa.io/extensions.cadence





# [1.0.0-alpha.295](https://github.com/toa-io/toa/compare/v1.0.0-alpha.294...v1.0.0-alpha.295) (2026-09-07)

**Note:** Version bump only for package @toa.io/extensions.cadence





# [1.0.0-alpha.294](https://github.com/toa-io/toa/compare/v1.0.0-alpha.293...v1.0.0-alpha.294) (2026-09-07)

**Note:** Version bump only for package @toa.io/extensions.cadence





# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

**Note:** Version bump only for package @toa.io/extensions.cadence





# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

### Features

* **definitions:** what a package declares is read from one package ([7052341](https://github.com/toa-io/toa/commit/70523411b5d9e2b204c999aa02365173f3bb518d))


# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/extensions.cadence





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/extensions.cadence





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

### Bug Fixes

* **cadence:** the scan reads what is owed, and nothing that is done ([581610e](https://github.com/toa-io/toa/commit/581610e87ac54c42491c882d5749ff3307700d35))
