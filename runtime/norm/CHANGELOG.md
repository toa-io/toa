# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.314](https://github.com/toa-io/toa/compare/v1.0.0-alpha.313...v1.0.0-alpha.314) (2026-09-19)

* feat(core)!: let an operation state how long its calls are remembered ([af177c2](https://github.com/toa-io/toa/commit/af177c2ab3d00d475840b5ef9e612f04e82b72bd))
* feat(core)!: rename trailers to the TRAILERS system property ([8d59ef9](https://github.com/toa-io/toa/commit/8d59ef90d04b7329578203fe10bd21fe41dfe2f5))

### Features

* **core:** a reference may name a declaration its package claims ([8040f60](https://github.com/toa-io/toa/commit/8040f60976549ab90497675bb54e664261f5b6bb))

### BREAKING CHANGES

* `inbox.retention` under 600 is refused. See
  migrations/313.md.
* `state._trailers` is `state.TRAILERS`; see migrations/313.md.


# [1.0.0-alpha.313](https://github.com/toa-io/toa/compare/v1.0.0-alpha.312...v1.0.0-alpha.313) (2026-09-18)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.312](https://github.com/toa-io/toa/compare/v1.0.0-alpha.311...v1.0.0-alpha.312) (2026-09-18)

### Features

* **bindings.http:** carry a call that holds a stream ([c571793](https://github.com/toa-io/toa/commit/c571793b617e3d5ae1dce5b98b64d67d7d8224f6))
* **cli:** write the property that carries a stream into a component's types ([8eae8ce](https://github.com/toa-io/toa/commit/8eae8cea011c0be78b27ed1380a1a6f17c9479f8))
* **norm:** let an operation declare the input property that carries a stream ([85a8f1f](https://github.com/toa-io/toa/commit/85a8f1ff5b62f658e0527dcce7230d8388d28fe0))
* **operations:** refuse to render a chart for a context with no version ([d6cd083](https://github.com/toa-io/toa/commit/d6cd083bfe8d7da9f3d451c2c25d821eb41ce958))


# [1.0.0-alpha.311](https://github.com/toa-io/toa/compare/v1.0.0-alpha.310...v1.0.0-alpha.311) (2026-09-17)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.310](https://github.com/toa-io/toa/compare/v1.0.0-alpha.309...v1.0.0-alpha.310) (2026-09-16)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.309](https://github.com/toa-io/toa/compare/v1.0.0-alpha.308...v1.0.0-alpha.309) (2026-09-16)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.308](https://github.com/toa-io/toa/compare/v1.0.0-alpha.307...v1.0.0-alpha.308) (2026-09-15)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.307](https://github.com/toa-io/toa/compare/v1.0.0-alpha.306...v1.0.0-alpha.307) (2026-09-15)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.306](https://github.com/toa-io/toa/compare/v1.0.0-alpha.305...v1.0.0-alpha.306) (2026-09-14)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.305](https://github.com/toa-io/toa/compare/v1.0.0-alpha.304...v1.0.0-alpha.305) (2026-09-13)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.304](https://github.com/toa-io/toa/compare/v1.0.0-alpha.303...v1.0.0-alpha.304) (2026-09-13)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.303](https://github.com/toa-io/toa/compare/v1.0.0-alpha.302...v1.0.0-alpha.303) (2026-09-12)

### Features

* **operations:** a composition states how many replicas it runs ([4466f5a](https://github.com/toa-io/toa/commit/4466f5abcc22c6dceb2994a0143b6bf9d5201d9d))
* **telemetry:** let a component declare its own metrics ([05aa3c7](https://github.com/toa-io/toa/commit/05aa3c72cd6a160e1cef99df6176a7f627075bc0))


# [1.0.0-alpha.302](https://github.com/toa-io/toa/compare/v1.0.0-alpha.301...v1.0.0-alpha.302) (2026-09-11)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

### Bug Fixes

* **norm:** an operation that takes no input states none ([3b69b4c](https://github.com/toa-io/toa/commit/3b69b4c92b3f06361a3552f036a927f4ff32e58b))

### Features

* **norm:** an environment name may fall back along a colon-separated chain ([a267c1c](https://github.com/toa-io/toa/commit/a267c1caae816a75ada8352d5361b99817c72eb1))
* **operations:** an evicted component is given its environment and configuration ([6cf7890](https://github.com/toa-io/toa/commit/6cf7890a632a2185d2b7d9790890a04187e5a897))


# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

* feat(boot)!: a process is a thing, and an extension may keep something in one ([528d6cd](https://github.com/toa-io/toa/commit/528d6cdd307b45a6c30b6a184d7e06b3328cecf8))
* feat(core)!: an operation may ask to run once ([dca616c](https://github.com/toa-io/toa/commit/dca616cb380a7a389e277875d3bd5ca55a6e4d45))

### Features

* **core:** a call may name the process it goes to, and wait for a set time ([7d8adb2](https://github.com/toa-io/toa/commit/7d8adb2772a95ff45ae5374efdedfb5a857fbbe9))
* **core:** an assignment may ask to run once as well ([10fbcbd](https://github.com/toa-io/toa/commit/10fbcbd86a5e82960e65f62c09d0a465ae8d0353))
* **norm:** a context says what it does not deploy ([135e6fd](https://github.com/toa-io/toa/commit/135e6fdfbc4270762028e9e5a0516766960ce59c))

### BREAKING CHANGES

* `Storage.store`, `.upsert` and `.ensure` take one more
  argument, and `Storage` has two more members. A connector that ignores them
  works exactly as it did; a component that asks it for `once` is refused at
  boot. See migrations/299.md.
* a composition booted directly has no readiness probe. Readiness is
  the process's, and a composition is not a process. `stage.workload` boots one where a
  suite needs it.


# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

### Features

* **convergence:** deployments of one context converge ([8a70343](https://github.com/toa-io/toa/commit/8a70343cf6953aab58d4a25bac215508ff8d9a37))
* **convergence:** what an extension ships converges too ([b3be33d](https://github.com/toa-io/toa/commit/b3be33d2a1db45cfd844288467441aea2f4a722d))
* **core:** a record carries the region that wrote it ([13ed187](https://github.com/toa-io/toa/commit/13ed187604f06dec66feec2e26ccf9dae30bb048))


# [1.0.0-alpha.298](https://github.com/toa-io/toa/compare/v1.0.0-alpha.297...v1.0.0-alpha.298) (2026-09-08)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.297](https://github.com/toa-io/toa/compare/v1.0.0-alpha.296...v1.0.0-alpha.297) (2026-09-08)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.296](https://github.com/toa-io/toa/compare/v1.0.0-alpha.295...v1.0.0-alpha.296) (2026-09-08)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.295](https://github.com/toa-io/toa/compare/v1.0.0-alpha.294...v1.0.0-alpha.295) (2026-09-07)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.294](https://github.com/toa-io/toa/compare/v1.0.0-alpha.293...v1.0.0-alpha.294) (2026-09-07)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

### Features

* **cli:** the deployment library is a peer, and the binary is the CLI's ([a923f81](https://github.com/toa-io/toa/commit/a923f8173a55ed1c091213a7c7db1863ca1d0ba6))
* **definitions:** the version of Toa is the definitions package's ([3d0272e](https://github.com/toa-io/toa/commit/3d0272ea0ab862f4b6c2e58a2f003f92d0f8a87f))
* **definitions:** what a package declares is read from one package ([7052341](https://github.com/toa-io/toa/commit/70523411b5d9e2b204c999aa02365173f3bb518d))
* **norm:** a package's definition is read by one resolver ([bffd41c](https://github.com/toa-io/toa/commit/bffd41c8d18c42786b0bf321623088b9dabc4724))


# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/norm





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

**Note:** Version bump only for package @toa.io/norm
