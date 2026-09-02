# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.273](https://github.com/toa-io/toa/compare/v1.0.0-alpha.272...v1.0.0-alpha.273) (2026-09-02)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


### Bug Fixes

* **core:** stop the reply contract from relaxing the declaration ([6222893](https://github.com/toa-io/toa/commit/622289326630b94deff93499d6a851bfaa57c69a))


* feat(atomicity)!: take a quorum of independent servers ([862562f](https://github.com/toa-io/toa/commit/862562f24d77ec00127dbbd88d43802b208c643b))
* refactor(atomicity)!: take the lock manager from the stash ([4fd91eb](https://github.com/toa-io/toa/commit/4fd91eb2fdb68f7b87aaf16d182794bbc567ba57))
* refactor(core)!: pump the outbox in one cycle ([bf590fe](https://github.com/toa-io/toa/commit/bf590fe8ed59c701b5fd1a91ba4874685b79242f))
* refactor(atomicity)!: make the connector a family, not a partitioner ([06fd63a](https://github.com/toa-io/toa/commit/06fd63ad6296b724ef83afccf4e4e25d0bcaf080))
* refactor(atomicity)!: rename the connector and free it of the outbox ([21f1a41](https://github.com/toa-io/toa/commit/21f1a41aceafcfd35c7620014062fe46b54afa95))
* feat(core)!: commit events with the state that produced them ([1eb68cc](https://github.com/toa-io/toa/commit/1eb68cc435dbfa03faa16009fceb866693d22e1a)), closes [#20](https://github.com/toa-io/toa/issues/20)


### Features

* **atomicity:** meter what the group has spent ([bb1118a](https://github.com/toa-io/toa/commit/bb1118aa60bfeb43d3212f2495b7797445f003c3))
* **core:** give every component an atom aspect ([b501b9c](https://github.com/toa-io/toa/commit/b501b9cd3d5f5408d9faa71213e953fe2792cf9f))


### BREAKING CHANGES

* `atomicity.redis` accepts a list again, of independent servers rather
than cluster nodes, and refuses an even number of them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `context.stash.lock` is gone; lock through `context.atom` instead.
A stash pointer resolving to several addresses now uses the first.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `Storage.outbox.pending` takes a fourth argument, the id to
continue from.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `Factory.partition(group)` is `Factory.atom(group)`, and the
`Partition` it returned is an `Atom`. `slots(total)` is unchanged.

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

* **core:** apply the input default on a remote call ([341699b](https://github.com/toa-io/toa/commit/341699b26c9299963a898368671633a9b3fb97ed))


### Performance Improvements

* **core:** do not snapshot a record an operation cannot commit ([a5e695b](https://github.com/toa-io/toa/commit/a5e695b0b1d4b00a91e40336deecd476c9646c89))
* **core:** keep the parsed criteria of a query ([7efc694](https://github.com/toa-io/toa/commit/7efc694814c2a071ae7e48dbf1c6014db6025a9f))
* stop rebuilding per-call values that never change ([4202504](https://github.com/toa-io/toa/commit/4202504c33fb9ef9694f9995f3d0397d3a186438))





# [1.0.0-alpha.266](https://github.com/toa-io/toa/compare/v1.0.0-alpha.265...v1.0.0-alpha.266) (2026-08-29)


### Bug Fixes

* **core:** say a connector is disconnected once it has closed, not before ([d67b48e](https://github.com/toa-io/toa/commit/d67b48eaafaacd5c635d8b066413f84b8e6a3771))





# [1.0.0-alpha.265](https://github.com/toa-io/toa/compare/v1.0.0-alpha.264...v1.0.0-alpha.265) (2026-08-29)


### Features

* **bridges.node:** add the dispose run command phase ([00df715](https://github.com/toa-io/toa/commit/00df7158f638b976ab09d4007102a4ead3c696c3))





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Features

* **core:** identify the origin of a call with `request.source` ([9da6b66](https://github.com/toa-io/toa/commit/9da6b66df852690351a1e82c7b8cc176fd89774a))





# [1.0.0-alpha.259](https://github.com/toa-io/toa/compare/v1.0.0-alpha.258...v1.0.0-alpha.259) (2026-08-24)


### Features

* **runtime:** split component RC into preflight and settle ([0d648b3](https://github.com/toa-io/toa/commit/0d648b314e4aac226c254bf01a86affa04b59b34))





# [1.0.0-alpha.257](https://github.com/toa-io/toa/compare/v1.0.0-alpha.256...v1.0.0-alpha.257) (2026-08-24)


### Bug Fixes

* **core:** lift tombstone on commit when transition leaves it untouched ([38c0d15](https://github.com/toa-io/toa/commit/38c0d15e946c3e2d559d4b18aecc33e0fda2471a))
