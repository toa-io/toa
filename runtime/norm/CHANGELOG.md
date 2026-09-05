# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.284](https://github.com/toa-io/toa/compare/v1.0.0-alpha.283...v1.0.0-alpha.284) (2026-09-05)

### Features

* an operation states what it is ([b5e2f66](https://github.com/toa-io/toa/commit/b5e2f66c8bf67924e2eaaaa11f283dfb4d810981))
* **cadence:** calls a component makes to itself, and calls it puts off ([8bbde5f](https://github.com/toa-io/toa/commit/8bbde5fc89e8e5549d5aa2bfcddb1beec0871565))


# [1.0.0-alpha.283](https://github.com/toa-io/toa/compare/v1.0.0-alpha.282...v1.0.0-alpha.283) (2026-09-04)

### Bug Fixes

* **exposition:** declare the errors the built-in components return ([27200c3](https://github.com/toa-io/toa/commit/27200c348ab09068d58c52c3e83208cb29cd7290))

### Features

* **operations:** run extension services inside a composition ([154aced](https://github.com/toa-io/toa/commit/154aced047228a250ac3bab353e09432fcc5a34d))


# [1.0.0-alpha.282](https://github.com/toa-io/toa/compare/v1.0.0-alpha.281...v1.0.0-alpha.282) (2026-09-03)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.278](https://github.com/toa-io/toa/compare/v1.0.0-alpha.277...v1.0.0-alpha.278) (2026-09-03)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.277](https://github.com/toa-io/toa/compare/v1.0.0-alpha.276...v1.0.0-alpha.277) (2026-09-03)

### Bug Fixes

* read a manifest the way js-yaml read one before ([fcea1b2](https://github.com/toa-io/toa/commit/fcea1b21996d6efa6c3198acbfc9f70f1ce0c35c))
* settle what the module loader made asynchronous ([d4ab9df](https://github.com/toa-io/toa/commit/d4ab9dfb09e382da311dba08f52214e7645f4a6c))
* what the loader resolves, and what it will not ([1b8a02f](https://github.com/toa-io/toa/commit/1b8a02ff0a5e0f18ee62e3f71bc81116f86f9af1))


# [1.0.0-alpha.274](https://github.com/toa-io/toa/compare/v1.0.0-alpha.273...v1.0.0-alpha.274) (2026-09-02)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.273](https://github.com/toa-io/toa/compare/v1.0.0-alpha.272...v1.0.0-alpha.273) (2026-09-02)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


### Bug Fixes

* **atomicity:** honour a cluster, and let it be unreachable ([c475d66](https://github.com/toa-io/toa/commit/c475d663ddf7329d86da517ccceee4cb03280e95))


* feat(atomicity)!: take a quorum of independent servers ([862562f](https://github.com/toa-io/toa/commit/862562f24d77ec00127dbbd88d43802b208c643b))
* refactor(atomicity)!: take one Redis, not a cluster ([b0a4770](https://github.com/toa-io/toa/commit/b0a4770dff5dfe8fee4b9ae637a4dd297454fcd4))
* refactor(atomicity)!: take the lock manager from the stash ([4fd91eb](https://github.com/toa-io/toa/commit/4fd91eb2fdb68f7b87aaf16d182794bbc567ba57))
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
* `context.stash.lock` is gone; lock through `context.atom` instead.
A stash pointer resolving to several addresses now uses the first.

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

* **norm:** resolve annotations keyed by a dependency id ([e2860cd](https://github.com/toa-io/toa/commit/e2860cd2cc93dd3a135c092db1d943f80648ee56))
* **norm:** return the hash after hashing a file ([35058bd](https://github.com/toa-io/toa/commit/35058bdaae19f367197ea5b800742349e507ab11))


### Performance Improvements

* **boot:** stop paying for what a composition does not need to start ([1619c27](https://github.com/toa-io/toa/commit/1619c2743072f4706939ce72f3074e615d26a91e))





# [1.0.0-alpha.266](https://github.com/toa-io/toa/compare/v1.0.0-alpha.265...v1.0.0-alpha.266) (2026-08-29)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.265](https://github.com/toa-io/toa/compare/v1.0.0-alpha.264...v1.0.0-alpha.265) (2026-08-29)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.263](https://github.com/toa-io/toa/compare/v1.0.0-alpha.262...v1.0.0-alpha.263) (2026-08-29)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Features

* **introspection:** add the introspection extension ([a07ed86](https://github.com/toa-io/toa/commit/a07ed8651404258d544f3b6d8236e58cf4da09ac))
* **operations:** let a service claim a path prefix on the host ([02677d1](https://github.com/toa-io/toa/commit/02677d17fcd4222b07c3be458d93bcc496a016a8))





# [1.0.0-alpha.259](https://github.com/toa-io/toa/compare/v1.0.0-alpha.258...v1.0.0-alpha.259) (2026-08-24)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.257](https://github.com/toa-io/toa/compare/v1.0.0-alpha.256...v1.0.0-alpha.257) (2026-08-24)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.256](https://github.com/toa-io/toa/compare/v1.0.0-alpha.255...v1.0.0-alpha.256) (2026-08-23)


### Features

* add toa mono and discover components at components/* ([787a111](https://github.com/toa-io/toa/commit/787a111c8f83e56ebc734801c97106c585d034ea))
* deploy a single mono image with toa deploy --mono ([a7f14f9](https://github.com/toa-io/toa/commit/a7f14f9877a280e9c74d16c195028b35d74fb15a))
