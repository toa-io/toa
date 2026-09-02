# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


* feat(atomicity)!: take a quorum of independent servers ([862562f](https://github.com/toa-io/toa/commit/862562f24d77ec00127dbbd88d43802b208c643b))
* refactor(atomicity)!: take one Redis, not a cluster ([b0a4770](https://github.com/toa-io/toa/commit/b0a4770dff5dfe8fee4b9ae637a4dd297454fcd4))
* refactor(core)!: pump the outbox in one cycle ([bf590fe](https://github.com/toa-io/toa/commit/bf590fe8ed59c701b5fd1a91ba4874685b79242f))
* refactor(atomicity)!: rename the connector and free it of the outbox ([21f1a41](https://github.com/toa-io/toa/commit/21f1a41aceafcfd35c7620014062fe46b54afa95))
* feat(core)!: commit events with the state that produced them ([1eb68cc](https://github.com/toa-io/toa/commit/1eb68cc435dbfa03faa16009fceb866693d22e1a)), closes [#20](https://github.com/toa-io/toa/issues/20)


### Features

* **atomicity:** make the interval a setting, and stop repeating n-and-i ([5c3a6d1](https://github.com/toa-io/toa/commit/5c3a6d1533751a21b7eb7d9c737f1a270bf5a5ae))


### BREAKING CHANGES

* `atomicity.redis` accepts a list again, of independent servers rather
than cluster nodes, and refuses an even number of them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `atomicity.redis` is a string. A list is refused at export.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `Storage.outbox.pending` takes a fourth argument, the id to
continue from.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `@toa.io/partitions.redis` is now `@toa.io/atomicity`, and its
`lanes(total)` is `slots(total)`. Redis is declared as `atomicity` in the context
rather than `outbox.redis`, and read from `TOA_ATOMICITY_REDIS`.
`TOA_OUTBOX_PARTITION_INTERVAL` is `TOA_ATOMICITY_INTERVAL`.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `event.changeset` is removed; use `origin` and `state`. `State`
takes an `Outbox` in place of an `Emission`. `difference` is dropped from
`@toa.io/generic` along with its last caller.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.270](https://github.com/toa-io/toa/compare/v1.0.0-alpha.269...v1.0.0-alpha.270) (2026-08-31)


### Bug Fixes

* **operations:** let a composition set its own base image ([61ba331](https://github.com/toa-io/toa/commit/61ba3319dc91915a3197d348111af411bbd5bff1))





# [1.0.0-alpha.266](https://github.com/toa-io/toa/compare/v1.0.0-alpha.265...v1.0.0-alpha.266) (2026-08-29)

**Note:** Version bump only for package @toa.io/operations





# [1.0.0-alpha.265](https://github.com/toa-io/toa/compare/v1.0.0-alpha.264...v1.0.0-alpha.265) (2026-08-29)

**Note:** Version bump only for package @toa.io/operations





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)

**Note:** Version bump only for package @toa.io/operations





# [1.0.0-alpha.263](https://github.com/toa-io/toa/compare/v1.0.0-alpha.262...v1.0.0-alpha.263) (2026-08-29)

**Note:** Version bump only for package @toa.io/operations





# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Bug Fixes

* **cli:** boot toa mono from components and env, not context ([1518f72](https://github.com/toa-io/toa/commit/1518f729d7611ae88e0538f286231d283a7098ef))


* feat(operations)!: require service ports to be unique ([b22cf87](https://github.com/toa-io/toa/commit/b22cf8770d24c555b5f355a5f117a9043a57799b))


### Features

* **operations:** let a service claim a path prefix on the host ([02677d1](https://github.com/toa-io/toa/commit/02677d17fcd4222b07c3be458d93bcc496a016a8))


### BREAKING CHANGES

* an application whose own extension runs a service on a port
already taken by another — 8000 by the exposition gateway, 8001 by the telemetry
readiness probe — must move it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.261](https://github.com/toa-io/toa/compare/v1.0.0-alpha.260...v1.0.0-alpha.261) (2026-08-26)


### Bug Fixes

* **operations:** include extension pointer variables in --mono ([f8be23d](https://github.com/toa-io/toa/commit/f8be23d2aaf7bbe1b0580101c8bf4d32c3cab99f))





# [1.0.0-alpha.259](https://github.com/toa-io/toa/compare/v1.0.0-alpha.258...v1.0.0-alpha.259) (2026-08-24)

**Note:** Version bump only for package @toa.io/operations





# [1.0.0-alpha.257](https://github.com/toa-io/toa/compare/v1.0.0-alpha.256...v1.0.0-alpha.257) (2026-08-24)

**Note:** Version bump only for package @toa.io/operations





# [1.0.0-alpha.256](https://github.com/toa-io/toa/compare/v1.0.0-alpha.255...v1.0.0-alpha.256) (2026-08-23)


### Features

* deploy a single mono image with toa deploy --mono ([a7f14f9](https://github.com/toa-io/toa/commit/a7f14f9877a280e9c74d16c195028b35d74fb15a))
