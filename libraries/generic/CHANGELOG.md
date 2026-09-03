# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.278](https://github.com/toa-io/toa/compare/v1.0.0-alpha.277...v1.0.0-alpha.278) (2026-09-03)

### Bug Fixes

* **generic:** leave writing YAML to js-yaml's own schema ([650aa8f](https://github.com/toa-io/toa/commit/650aa8f0e9734ea236c575ee2e5675c31e8ad485))


# [1.0.0-alpha.277](https://github.com/toa-io/toa/compare/v1.0.0-alpha.276...v1.0.0-alpha.277) (2026-09-03)

### Bug Fixes

* read a manifest the way js-yaml read one before ([fcea1b2](https://github.com/toa-io/toa/commit/fcea1b21996d6efa6c3198acbfc9f70f1ce0c35c))
* read only the merge key back into the schema ([5172ee7](https://github.com/toa-io/toa/commit/5172ee702051fe29f5a6dd78f09f39f11706fd97))


# [1.0.0-alpha.273](https://github.com/toa-io/toa/compare/v1.0.0-alpha.272...v1.0.0-alpha.273) (2026-09-02)

**Note:** Version bump only for package @toa.io/generic





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


* feat(core)!: commit events with the state that produced them ([1eb68cc](https://github.com/toa-io/toa/commit/1eb68cc435dbfa03faa16009fceb866693d22e1a)), closes [#20](https://github.com/toa-io/toa/issues/20)


### BREAKING CHANGES

* `event.changeset` is removed; use `origin` and `state`. `State`
takes an `Outbox` in place of an `Emission`. `difference` is dropped from
`@toa.io/generic` along with its last caller.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
