# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.313](https://github.com/toa-io/toa/compare/v1.0.0-alpha.312...v1.0.0-alpha.313) (2026-09-18)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.312](https://github.com/toa-io/toa/compare/v1.0.0-alpha.311...v1.0.0-alpha.312) (2026-09-18)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.311](https://github.com/toa-io/toa/compare/v1.0.0-alpha.310...v1.0.0-alpha.311) (2026-09-17)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.310](https://github.com/toa-io/toa/compare/v1.0.0-alpha.309...v1.0.0-alpha.310) (2026-09-16)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.309](https://github.com/toa-io/toa/compare/v1.0.0-alpha.308...v1.0.0-alpha.309) (2026-09-16)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.308](https://github.com/toa-io/toa/compare/v1.0.0-alpha.307...v1.0.0-alpha.308) (2026-09-15)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.307](https://github.com/toa-io/toa/compare/v1.0.0-alpha.306...v1.0.0-alpha.307) (2026-09-15)

### Bug Fixes

* **introspection:** host the components the deployment provisioned ([b36d80b](https://github.com/toa-io/toa/commit/b36d80b154e40275c610b021cfb2c9628cac7cab))


# [1.0.0-alpha.306](https://github.com/toa-io/toa/compare/v1.0.0-alpha.305...v1.0.0-alpha.306) (2026-09-14)

* feat(introspection)!: remove payload samples ([934db2a](https://github.com/toa-io/toa/commit/934db2a2f617833cae37501c6ea8957f3d0a4c7d))
* refactor(introspection)!: a signal is written and not read ([7dd17e9](https://github.com/toa-io/toa/commit/7dd17e9afd9344200737846b678379ab920c1517))
* feat(boot)!: a process can be halted and come back ([7196fa5](https://github.com/toa-io/toa/commit/7196fa51a9c882e84c3767a4fdd329fd2df319f5))

### Bug Fixes

* **introspection:** do not take an unanswered write for a stop that was called ([930d231](https://github.com/toa-io/toa/commit/930d231b82ffdd0cda42cb44a9a2e4a68f7408c4))
* **introspection:** hold the countdown badge to one width ([9ce301a](https://github.com/toa-io/toa/commit/9ce301a454174d7f41cbf04a44b76cbf28891fdb))
* **introspection:** open the halt form on numbers that can be pressed ([1db3df1](https://github.com/toa-io/toa/commit/1db3df137d7531c8b945e511c96bb1d67ffb1996))
* **introspection:** open the halt form on what is usual, within what is allowed ([e950c04](https://github.com/toa-io/toa/commit/e950c04733336af99ef1a533517a50f2d4c6014b))

### Features

* **introspection:** a HALT control in the header ([df076a5](https://github.com/toa-io/toa/commit/df076a50a329c97c57c379046791325735eb3ed2))
* **introspection:** a signal stops every process of a deployment ([bfeda01](https://github.com/toa-io/toa/commit/bfeda01133e0388ad577203f3d00ea87861646f9))
* **introspection:** ask for duration and quiescence on the halt form ([675dd17](https://github.com/toa-io/toa/commit/675dd1749b9d15f67171098f6ddabb37afe6535c))
* **introspection:** hold, count down, and halt the deployment ([8dae775](https://github.com/toa-io/toa/commit/8dae77596b5923a3d74f6c9a40a6eb90047ea773))
* **introspection:** let a deployment say what a halt may ask for ([a40d3ed](https://github.com/toa-io/toa/commit/a40d3ed6a07772be5bb747882cf1f4753b384b24))
* **introspection:** stop a deployment only once it has been seen still ([268db9b](https://github.com/toa-io/toa/commit/268db9b5a9f95716d6fc50c384d3fa101e21ce57))

### BREAKING CHANGES

* `Host` gains `gate` and `halt`, and `Factory.service` may answer a gate. An
  extension that gates nothing keeps its connections through a halt.
* `introspection.samples` is read by nothing, in a context and in a manifest
  alike, and an edge carries no `sample`.
* `introspection.signals` exposes `POST` alone.


# [1.0.0-alpha.305](https://github.com/toa-io/toa/compare/v1.0.0-alpha.304...v1.0.0-alpha.305) (2026-09-13)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.304](https://github.com/toa-io/toa/compare/v1.0.0-alpha.303...v1.0.0-alpha.304) (2026-09-13)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.303](https://github.com/toa-io/toa/compare/v1.0.0-alpha.302...v1.0.0-alpha.303) (2026-09-12)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.302](https://github.com/toa-io/toa/compare/v1.0.0-alpha.301...v1.0.0-alpha.302) (2026-09-11)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

### Reverts

* **ui:** the shadcn component indexes are as the generator writes them ([e02f03e](https://github.com/toa-io/toa/commit/e02f03e29d0565be83a936bfd21c24b49206e63f))


# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

### Bug Fixes

* **extensions:** what a factory remembers does not outlive the tree it was made for ([dd36631](https://github.com/toa-io/toa/commit/dd3663160f500eadfb701bf840ef3741a2d075f0))


# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

### Features

* **core:** a record carries the region that wrote it ([13ed187](https://github.com/toa-io/toa/commit/13ed187604f06dec66feec2e26ccf9dae30bb048))
* **core:** every system property is required ([52c468a](https://github.com/toa-io/toa/commit/52c468aacb03d0347a0e044f6bd76677bdd6af36))


# [1.0.0-alpha.298](https://github.com/toa-io/toa/compare/v1.0.0-alpha.297...v1.0.0-alpha.298) (2026-09-08)

### Bug Fixes

* **ui:** system fonts, and the discovery signature follows the list ([81abb0f](https://github.com/toa-io/toa/commit/81abb0f347383793ce9cfc34ff25e0f98c223a11))


# [1.0.0-alpha.297](https://github.com/toa-io/toa/compare/v1.0.0-alpha.296...v1.0.0-alpha.297) (2026-09-08)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.296](https://github.com/toa-io/toa/compare/v1.0.0-alpha.295...v1.0.0-alpha.296) (2026-09-08)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.295](https://github.com/toa-io/toa/compare/v1.0.0-alpha.294...v1.0.0-alpha.295) (2026-09-07)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.294](https://github.com/toa-io/toa/compare/v1.0.0-alpha.293...v1.0.0-alpha.294) (2026-09-07)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

### Features

* **definitions:** what a package declares is read from one package ([7052341](https://github.com/toa-io/toa/commit/70523411b5d9e2b204c999aa02365173f3bb518d))


# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

**Note:** Version bump only for package @toa.io/extensions.introspection
