# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.273](https://github.com/toa-io/toa/compare/v1.0.0-alpha.272...v1.0.0-alpha.273) (2026-09-02)

**Note:** Version bump only for package @toa.io/atomicity





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


### Bug Fixes

* **atomicity:** honour a cluster, and let it be unreachable ([c475d66](https://github.com/toa-io/toa/commit/c475d663ddf7329d86da517ccceee4cb03280e95))
* **atomicity:** stop swallowing faults from the discovery loop ([449f79a](https://github.com/toa-io/toa/commit/449f79a011611f2e14ad5a325a9f7f7161433060))


* feat(atomicity)!: take a quorum of independent servers ([862562f](https://github.com/toa-io/toa/commit/862562f24d77ec00127dbbd88d43802b208c643b))
* refactor(atomicity)!: take one Redis, not a cluster ([b0a4770](https://github.com/toa-io/toa/commit/b0a4770dff5dfe8fee4b9ae637a4dd297454fcd4))
* refactor(atomicity)!: take the lock manager from the stash ([4fd91eb](https://github.com/toa-io/toa/commit/4fd91eb2fdb68f7b87aaf16d182794bbc567ba57))
* refactor(atomicity)!: make the connector a family, not a partitioner ([06fd63a](https://github.com/toa-io/toa/commit/06fd63ad6296b724ef83afccf4e4e25d0bcaf080))
* refactor(atomicity)!: rename the connector and free it of the outbox ([21f1a41](https://github.com/toa-io/toa/commit/21f1a41aceafcfd35c7620014062fe46b54afa95))


### Features

* **atomicity:** make the interval a setting, and stop repeating n-and-i ([5c3a6d1](https://github.com/toa-io/toa/commit/5c3a6d1533751a21b7eb7d9c737f1a270bf5a5ae))
* **atomicity:** meter what the group has spent ([bb1118a](https://github.com/toa-io/toa/commit/bb1118aa60bfeb43d3212f2495b7797445f003c3))


### BREAKING CHANGES

* `atomicity.redis` accepts a list again, of independent servers rather
than cluster nodes, and refuses an even number of them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* `atomicity.redis` is a string. A list is refused at export.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
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
