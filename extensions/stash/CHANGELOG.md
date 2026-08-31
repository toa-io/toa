# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.270](https://github.com/toa-io/toa/compare/v1.0.0-alpha.269...v1.0.0-alpha.270) (2026-08-31)


* feat(exposition)!: throttle by a distributed GCRA ([287eb25](https://github.com/toa-io/toa/commit/287eb254b11339b20ef011deb659eb11f225defe))


### BREAKING CHANGES

* `io:throttle` no longer takes `cooldown`, and its schema now
rejects unknown properties, so a declaration carrying one fails at boot instead of
being ignored quietly. Metering earns the budget back rather than locking a key
out, so the lockout is expressed as a rate: `requests: 20, interval: 600` admits a
burst of twenty and then one every thirty seconds, where `requests: 20, interval:
60, cooldown: 600` used to refuse everything for ten minutes. The stash aspect's
`count` is replaced by `meter`, which takes a batch of keys and debts and answers
what the group has reached.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.268](https://github.com/toa-io/toa/compare/v1.0.0-alpha.267...v1.0.0-alpha.268) (2026-08-30)


### Features

* **stash:** add distributed counting ([6d0af7e](https://github.com/toa-io/toa/commit/6d0af7e58a1deece00256129bc976bebc416ae90))





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)

**Note:** Version bump only for package @toa.io/extensions.stash





# [1.0.0-alpha.263](https://github.com/toa-io/toa/compare/v1.0.0-alpha.262...v1.0.0-alpha.263) (2026-08-29)

**Note:** Version bump only for package @toa.io/extensions.stash
