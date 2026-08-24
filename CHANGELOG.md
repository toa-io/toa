# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.257](https://github.com/toa-io/toa/compare/v1.0.0-alpha.256...v1.0.0-alpha.257) (2026-08-24)


### Bug Fixes

* **core:** lift tombstone on commit when transition leaves it untouched ([38c0d15](https://github.com/toa-io/toa/commit/38c0d15e946c3e2d559d4b18aecc33e0fda2471a))
* **exposition:** allow null output of basic credentials info ([2a98d0c](https://github.com/toa-io/toa/commit/2a98d0c4c7dd510d57f23485fd516990c79e6759))
* **exposition:** re-add deleted basic credentials ([93abdb7](https://github.com/toa-io/toa/commit/93abdb7c97f807d400a236c417af716dbd367189))
* **exposition:** return identity id from federation inception ([4ddcb7e](https://github.com/toa-io/toa/commit/4ddcb7ee7e574d79f783816190381b5bd6eb2dce))
* **exposition:** revive deleted federation credential on create ([89e6363](https://github.com/toa-io/toa/commit/89e6363778a5e503957c339d1626cda0827fbed8))
* **storages.mongodb:** drop unconditional tombstone lift on set ([8e2d201](https://github.com/toa-io/toa/commit/8e2d201e55ff02492529727b38e92a5006598171))
* **storages.mongodb:** lift tombstone on set ([b33d227](https://github.com/toa-io/toa/commit/b33d227dbe1d6c95957d67d31bbe2543e1def8c1))


### Features

* **exposition:** add federation create operation ([0262d7d](https://github.com/toa-io/toa/commit/0262d7d18362d580fc1dd923225c9acba01e751a))
* **exposition:** detach federation credential id from identity ([63a54e4](https://github.com/toa-io/toa/commit/63a54e44a63c846886d7ed55b29de3e85b4725ff))
* **exposition:** return the credential from federation inception ([fced302](https://github.com/toa-io/toa/commit/fced302d16979d234f5a3dbf0ed3897362e95b90))
* **exposition:** unique federation credential per identity and issuer ([0c3e11b](https://github.com/toa-io/toa/commit/0c3e11b2e2497319dc66d566330f8e03c4e35f8d))





# [1.0.0-alpha.256](https://github.com/toa-io/toa/compare/v1.0.0-alpha.255...v1.0.0-alpha.256) (2026-08-23)


### Features

* add toa mono and discover components at components/* ([787a111](https://github.com/toa-io/toa/commit/787a111c8f83e56ebc734801c97106c585d034ea))
* deploy a single mono image with toa deploy --mono ([a7f14f9](https://github.com/toa-io/toa/commit/a7f14f9877a280e9c74d16c195028b35d74fb15a))
