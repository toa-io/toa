# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.263](https://github.com/toa-io/toa/compare/v1.0.0-alpha.262...v1.0.0-alpha.263) (2026-08-29)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Bug Fixes

* **cli:** boot toa mono from components and env, not context ([1518f72](https://github.com/toa-io/toa/commit/1518f729d7611ae88e0538f286231d283a7098ef))
* **cli:** say why a service has nothing to run ([458e86b](https://github.com/toa-io/toa/commit/458e86b347d5eff7fc69eb661e54d09509b93c39))


* refactor(cli)!: remove the invoke command ([819b81e](https://github.com/toa-io/toa/commit/819b81e6af777502ea6942533c151b20ee885cc0))


### Features

* **core:** identify the origin of a call with `request.source` ([9da6b66](https://github.com/toa-io/toa/commit/9da6b66df852690351a1e82c7b8cc176fd89774a))


### BREAKING CHANGES

* use `toa compose` and `toa call` instead — the first runs the
components, the second calls one of them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.261](https://github.com/toa-io/toa/compare/v1.0.0-alpha.260...v1.0.0-alpha.261) (2026-08-26)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.259](https://github.com/toa-io/toa/compare/v1.0.0-alpha.258...v1.0.0-alpha.259) (2026-08-24)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.257](https://github.com/toa-io/toa/compare/v1.0.0-alpha.256...v1.0.0-alpha.257) (2026-08-24)

**Note:** Version bump only for package @toa.io/cli





# [1.0.0-alpha.256](https://github.com/toa-io/toa/compare/v1.0.0-alpha.255...v1.0.0-alpha.256) (2026-08-23)


### Features

* add toa mono and discover components at components/* ([787a111](https://github.com/toa-io/toa/commit/787a111c8f83e56ebc734801c97106c585d034ea))
* deploy a single mono image with toa deploy --mono ([a7f14f9](https://github.com/toa-io/toa/commit/a7f14f9877a280e9c74d16c195028b35d74fb15a))
