# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.282](https://github.com/toa-io/toa/compare/v1.0.0-alpha.281...v1.0.0-alpha.282) (2026-09-03)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.281](https://github.com/toa-io/toa/compare/v1.0.0-alpha.280...v1.0.0-alpha.281) (2026-09-03)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.280](https://github.com/toa-io/toa/compare/v1.0.0-alpha.279...v1.0.0-alpha.280) (2026-09-03)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.279](https://github.com/toa-io/toa/compare/v1.0.0-alpha.278...v1.0.0-alpha.279) (2026-09-03)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.278](https://github.com/toa-io/toa/compare/v1.0.0-alpha.277...v1.0.0-alpha.278) (2026-09-03)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.277](https://github.com/toa-io/toa/compare/v1.0.0-alpha.276...v1.0.0-alpha.277) (2026-09-03)

### Bug Fixes

* settle what the module loader made asynchronous ([d4ab9df](https://github.com/toa-io/toa/commit/d4ab9dfb09e382da311dba08f52214e7645f4a6c))


# [1.0.0-alpha.276](https://github.com/toa-io/toa/compare/v1.0.0-alpha.275...v1.0.0-alpha.276) (2026-09-03)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.275](https://github.com/toa-io/toa/compare/v1.0.0-alpha.274...v1.0.0-alpha.275) (2026-09-02)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.274](https://github.com/toa-io/toa/compare/v1.0.0-alpha.273...v1.0.0-alpha.274) (2026-09-02)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.273](https://github.com/toa-io/toa/compare/v1.0.0-alpha.272...v1.0.0-alpha.273) (2026-09-02)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


* refactor(atomicity)!: rename the connector and free it of the outbox ([21f1a41](https://github.com/toa-io/toa/commit/21f1a41aceafcfd35c7620014062fe46b54afa95))


### Features

* **partitions.redis:** split the outbox sweep across replicas ([ca27b45](https://github.com/toa-io/toa/commit/ca27b45fdaa508171b1851bbc14c60db67f3e4b3))


### BREAKING CHANGES

* `@toa.io/partitions.redis` is now `@toa.io/atomicity`, and its
`lanes(total)` is `slots(total)`. Redis is declared as `atomicity` in the context
rather than `outbox.redis`, and read from `TOA_ATOMICITY_REDIS`.
`TOA_OUTBOX_PARTITION_INTERVAL` is `TOA_ATOMICITY_INTERVAL`.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.271](https://github.com/toa-io/toa/compare/v1.0.0-alpha.270...v1.0.0-alpha.271) (2026-08-31)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.270](https://github.com/toa-io/toa/compare/v1.0.0-alpha.269...v1.0.0-alpha.270) (2026-08-31)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.269](https://github.com/toa-io/toa/compare/v1.0.0-alpha.268...v1.0.0-alpha.269) (2026-08-30)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.268](https://github.com/toa-io/toa/compare/v1.0.0-alpha.267...v1.0.0-alpha.268) (2026-08-30)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.267](https://github.com/toa-io/toa/compare/v1.0.0-alpha.266...v1.0.0-alpha.267) (2026-08-29)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.266](https://github.com/toa-io/toa/compare/v1.0.0-alpha.265...v1.0.0-alpha.266) (2026-08-29)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.265](https://github.com/toa-io/toa/compare/v1.0.0-alpha.264...v1.0.0-alpha.265) (2026-08-29)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.263](https://github.com/toa-io/toa/compare/v1.0.0-alpha.262...v1.0.0-alpha.263) (2026-08-29)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Features

* **introspection:** add the introspection extension ([a07ed86](https://github.com/toa-io/toa/commit/a07ed8651404258d544f3b6d8236e58cf4da09ac))





# [1.0.0-alpha.261](https://github.com/toa-io/toa/compare/v1.0.0-alpha.260...v1.0.0-alpha.261) (2026-08-26)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.260](https://github.com/toa-io/toa/compare/v1.0.0-alpha.259...v1.0.0-alpha.260) (2026-08-25)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.259](https://github.com/toa-io/toa/compare/v1.0.0-alpha.258...v1.0.0-alpha.259) (2026-08-24)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.258](https://github.com/toa-io/toa/compare/v1.0.0-alpha.257...v1.0.0-alpha.258) (2026-08-24)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.257](https://github.com/toa-io/toa/compare/v1.0.0-alpha.256...v1.0.0-alpha.257) (2026-08-24)

**Note:** Version bump only for package @toa.io/runtime





# [1.0.0-alpha.256](https://github.com/toa-io/toa/compare/v1.0.0-alpha.255...v1.0.0-alpha.256) (2026-08-23)

**Note:** Version bump only for package @toa.io/runtime
