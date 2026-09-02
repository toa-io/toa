# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.273](https://github.com/toa-io/toa/compare/v1.0.0-alpha.272...v1.0.0-alpha.273) (2026-09-02)

**Note:** Version bump only for package @toa.io/generic





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


* feat(core)!: commit events with the state that produced them ([1eb68cc](https://github.com/toa-io/toa/commit/1eb68cc435dbfa03faa16009fceb866693d22e1a)), closes [#20](https://github.com/toa-io/toa/issues/20)


### BREAKING CHANGES

* `event.changeset` is removed; use `origin` and `state`. `State`
takes an `Outbox` in place of an `Emission`. `difference` is dropped from
`@toa.io/generic` along with its last caller.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
