# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.278](https://github.com/toa-io/toa/compare/v1.0.0-alpha.277...v1.0.0-alpha.278) (2026-09-03)

**Note:** Version bump only for package @toa.io/boot





# [1.0.0-alpha.277](https://github.com/toa-io/toa/compare/v1.0.0-alpha.276...v1.0.0-alpha.277) (2026-09-03)

### Bug Fixes

* read a manifest the way js-yaml read one before ([fcea1b2](https://github.com/toa-io/toa/commit/fcea1b21996d6efa6c3198acbfc9f70f1ce0c35c))
* settle what the module loader made asynchronous ([d4ab9df](https://github.com/toa-io/toa/commit/d4ab9dfb09e382da311dba08f52214e7645f4a6c))
* what the loader resolves, and what it will not ([1b8a02f](https://github.com/toa-io/toa/commit/1b8a02ff0a5e0f18ee62e3f71bc81116f86f9af1))


# [1.0.0-alpha.274](https://github.com/toa-io/toa/compare/v1.0.0-alpha.273...v1.0.0-alpha.274) (2026-09-02)

**Note:** Version bump only for package @toa.io/boot





# [1.0.0-alpha.273](https://github.com/toa-io/toa/compare/v1.0.0-alpha.272...v1.0.0-alpha.273) (2026-09-02)

**Note:** Version bump only for package @toa.io/boot





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


### Bug Fixes

* **amqp:** keep a receiver apart from the producers it delivers into ([4c2f43e](https://github.com/toa-io/toa/commit/4c2f43ebde68ba76a1fd277fe2a3305be1b622ef))
* **amqp:** tear a receiver down before its producers, and drop the split ([e6c1154](https://github.com/toa-io/toa/commit/e6c1154024df22f7a470c47c1a79bd170fe7e3b2))


* refactor(atomicity)!: take the lock manager from the stash ([4fd91eb](https://github.com/toa-io/toa/commit/4fd91eb2fdb68f7b87aaf16d182794bbc567ba57))
* refactor(atomicity)!: make the connector a family, not a partitioner ([06fd63a](https://github.com/toa-io/toa/commit/06fd63ad6296b724ef83afccf4e4e25d0bcaf080))
* refactor(atomicity)!: rename the connector and free it of the outbox ([21f1a41](https://github.com/toa-io/toa/commit/21f1a41aceafcfd35c7620014062fe46b54afa95))
* feat(core)!: commit events with the state that produced them ([1eb68cc](https://github.com/toa-io/toa/commit/1eb68cc435dbfa03faa16009fceb866693d22e1a)), closes [#20](https://github.com/toa-io/toa/issues/20)


### Features

* **core:** give every component an atom aspect ([b501b9c](https://github.com/toa-io/toa/commit/b501b9cd3d5f5408d9faa71213e953fe2792cf9f))


### BREAKING CHANGES

* `context.stash.lock` is gone; lock through `context.atom` instead.
A stash pointer resolving to several addresses now uses the first.

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


### Performance Improvements

* **boot:** stop paying for what a composition does not need to start ([1619c27](https://github.com/toa-io/toa/commit/1619c2743072f4706939ce72f3074e615d26a91e))
* **openspan:** create a span only when something records it ([a6efb0e](https://github.com/toa-io/toa/commit/a6efb0eed38393f4c169b067f23d7447f0169bca))





# [1.0.0-alpha.266](https://github.com/toa-io/toa/compare/v1.0.0-alpha.265...v1.0.0-alpha.266) (2026-08-29)

**Note:** Version bump only for package @toa.io/boot





# [1.0.0-alpha.265](https://github.com/toa-io/toa/compare/v1.0.0-alpha.264...v1.0.0-alpha.265) (2026-08-29)


### Features

* **bridges.node:** add the dispose run command phase ([00df715](https://github.com/toa-io/toa/commit/00df7158f638b976ab09d4007102a4ead3c696c3))





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)

**Note:** Version bump only for package @toa.io/boot





# [1.0.0-alpha.263](https://github.com/toa-io/toa/compare/v1.0.0-alpha.262...v1.0.0-alpha.263) (2026-08-29)

**Note:** Version bump only for package @toa.io/boot





# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Bug Fixes

* **boot:** let the composition own the process discovery ([2201e88](https://github.com/toa-io/toa/commit/2201e8852517fd1d2822c775c9b126eb60399580))


### Features

* **core:** identify the origin of a call with `request.source` ([9da6b66](https://github.com/toa-io/toa/commit/9da6b66df852690351a1e82c7b8cc176fd89774a))





# [1.0.0-alpha.259](https://github.com/toa-io/toa/compare/v1.0.0-alpha.258...v1.0.0-alpha.259) (2026-08-24)


### Features

* **runtime:** split component RC into preflight and settle ([0d648b3](https://github.com/toa-io/toa/commit/0d648b314e4aac226c254bf01a86affa04b59b34))





# [1.0.0-alpha.257](https://github.com/toa-io/toa/compare/v1.0.0-alpha.256...v1.0.0-alpha.257) (2026-08-24)

**Note:** Version bump only for package @toa.io/boot





# [1.0.0-alpha.256](https://github.com/toa-io/toa/compare/v1.0.0-alpha.255...v1.0.0-alpha.256) (2026-08-23)

**Note:** Version bump only for package @toa.io/boot
