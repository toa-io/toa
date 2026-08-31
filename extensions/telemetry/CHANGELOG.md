# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.270](https://github.com/toa-io/toa/compare/v1.0.0-alpha.269...v1.0.0-alpha.270) (2026-08-31)


### Bug Fixes

* **telemetry:** keep the ready probe from holding the process open ([1cb180b](https://github.com/toa-io/toa/commit/1cb180be2a0d13f61fc6d78ceecd18b339a94cf0))


### Performance Improvements

* **openspan:** create a span only when something records it ([a6efb0e](https://github.com/toa-io/toa/commit/a6efb0eed38393f4c169b067f23d7447f0169bca))





# [1.0.0-alpha.265](https://github.com/toa-io/toa/compare/v1.0.0-alpha.264...v1.0.0-alpha.265) (2026-08-29)


### Bug Fixes

* **telemetry:** signal readiness when the probe port is taken ([19722b8](https://github.com/toa-io/toa/commit/19722b8b2f3b9af969fc66c3c67e4d9cd87b952f))





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)


### Bug Fixes

* **openspan:** stop an unavailable OTLP endpoint delaying the shutdown ([e5f0d52](https://github.com/toa-io/toa/commit/e5f0d52805c150cd127f27d1cd39553da7c82aef))


### Performance Improvements

* **telemetry:** release the ready probe connections on shutdown ([5242f12](https://github.com/toa-io/toa/commit/5242f122cb0ccb01b16c48ef10f49cd0a603f15e))
