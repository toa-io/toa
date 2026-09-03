# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.277](https://github.com/toa-io/toa/compare/v1.0.0-alpha.276...v1.0.0-alpha.277) (2026-09-03)

### Bug Fixes

* drop the build output that landed beside the sources ([a724f69](https://github.com/toa-io/toa/commit/a724f6921190e5c9d945e33c6035bb12d832e5c8))


# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


* feat(openspan)!: make trace a log channel ([b107944](https://github.com/toa-io/toa/commit/b10794473ee442b28fa6b9b1c48ef9fc1d4471e5))


### BREAKING CHANGES

* `Console.trace(span)` is gone. `trace` is a log channel taking
`(message, attributes)`, and a span is written with `Console.entry` instead.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.270](https://github.com/toa-io/toa/compare/v1.0.0-alpha.269...v1.0.0-alpha.270) (2026-08-31)


### Performance Improvements

* **openspan:** create a span only when something records it ([a6efb0e](https://github.com/toa-io/toa/commit/a6efb0eed38393f4c169b067f23d7447f0169bca))





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)


### Bug Fixes

* **openspan:** stop an unavailable OTLP endpoint delaying the shutdown ([e5f0d52](https://github.com/toa-io/toa/commit/e5f0d52805c150cd127f27d1cd39553da7c82aef))
