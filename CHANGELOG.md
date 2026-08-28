# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Bug Fixes

* **amqp:** log reconnect attempts ([3903dc9](https://github.com/toa-io/toa/commit/3903dc9e31ba8365cd5aef20c09366a0cb7a56fe))
* **boot:** let the composition own the process discovery ([2201e88](https://github.com/toa-io/toa/commit/2201e8852517fd1d2822c775c9b126eb60399580))
* **cli:** boot toa mono from components and env, not context ([1518f72](https://github.com/toa-io/toa/commit/1518f729d7611ae88e0538f286231d283a7098ef))
* **cli:** say why a service has nothing to run ([458e86b](https://github.com/toa-io/toa/commit/458e86b347d5eff7fc69eb661e54d09509b93c39))
* **exposition:** serve endpoints declared in the context annotation ([49da8a4](https://github.com/toa-io/toa/commit/49da8a4234ee987b25023952d0622ce575dfb60c))
* **introspection:** keep the collector off the critical path ([965ec77](https://github.com/toa-io/toa/commit/965ec77482d361a5a9a88579152158c7e1c79e66))
* **introspection:** meet a card across the edge the line touches ([2002de9](https://github.com/toa-io/toa/commit/2002de9bdc12400abc64d5234fa319339db4588f))
* **introspection:** return the whole map over HTTP ([053c0cd](https://github.com/toa-io/toa/commit/053c0cd5c22b1a80bceb23d2cda68ede33a0d1c0))
* **introspection:** serve a route that looks like a file ([b43bbb4](https://github.com/toa-io/toa/commit/b43bbb4a290819463c61bcba64357385c2423d25))
* **introspection:** show the lines an opened neighbour sends ([5fe8aed](https://github.com/toa-io/toa/commit/5fe8aed64c1f1e54f1c10e29b91b50c5cdc296ab))
* **introspection:** wait for the page before capturing it ([9e63af3](https://github.com/toa-io/toa/commit/9e63af34ee090a4f90dce9658b0d022f4acae50f))
* **stage:** name the feature suite as the caller ([e4e593b](https://github.com/toa-io/toa/commit/e4e593b795cc7dc113f06e8a1554ae2ef36442c0))


* refactor(cli)!: remove the invoke command ([819b81e](https://github.com/toa-io/toa/commit/819b81e6af777502ea6942533c151b20ee885cc0))
* feat(introspection)!: publish the UI ([81fe2cb](https://github.com/toa-io/toa/commit/81fe2cb4bafe91e74d3af8359327e3102e5b0e8a))
* feat(operations)!: require service ports to be unique ([b22cf87](https://github.com/toa-io/toa/commit/b22cf8770d24c555b5f355a5f117a9043a57799b))


### Features

* **core:** identify the origin of a call with `request.source` ([9da6b66](https://github.com/toa-io/toa/commit/9da6b66df852690351a1e82c7b8cc176fd89774a))
* **introspection:** act on the only thing the filter left ([1a83709](https://github.com/toa-io/toa/commit/1a8370987b7d60c009f4d58f07005618899cdfd6))
* **introspection:** add the introspection extension ([a07ed86](https://github.com/toa-io/toa/commit/a07ed8651404258d544f3b6d8236e58cf4da09ac))
* **introspection:** animate a card opening on the map ([1d2180f](https://github.com/toa-io/toa/commit/1d2180f48fb9dc18d9fa0c2cc4eefa6f46626898))
* **introspection:** animate every collapsible from one place ([0b6a32b](https://github.com/toa-io/toa/commit/0b6a32b69128f2db2d3e449896614ff478f2775b))
* **introspection:** ask for the role rather than be refused it ([1ad01a7](https://github.com/toa-io/toa/commit/1ad01a7dd817ae37ed84e3a3b6b20b72049a4216))
* **introspection:** cache the map API ([f550c27](https://github.com/toa-io/toa/commit/f550c2780a80bbe2fdd131984c33d9848daa8c82))
* **introspection:** fold away a component's extensions ([de1bea6](https://github.com/toa-io/toa/commit/de1bea6329a1fd920cff6b5ad9a13eedfc527884))
* **introspection:** give a card's rows their own space ([3253639](https://github.com/toa-io/toa/commit/32536395b9d25e743c25b61deb9dbd5b79d966b6))
* **introspection:** give the map's two screens their own addresses ([90fd5af](https://github.com/toa-io/toa/commit/90fd5af39b8b6c38e22e05df46c70de533eb15c6))
* **introspection:** open a component on the map ([6382740](https://github.com/toa-io/toa/commit/63827403407fc5a305d95e9fde72ed5a99a1499a))
* **introspection:** open an operation onto what it takes ([f16a683](https://github.com/toa-io/toa/commit/f16a683175a89d3660c538768b24cd872b6d0b3d))
* **introspection:** publish the map as a page ([21b16b2](https://github.com/toa-io/toa/commit/21b16b2220a1b26796bdbedc85a0df2a88df31dd))
* **introspection:** say a component's shape in counts ([54aa771](https://github.com/toa-io/toa/commit/54aa771a51c257db759107d584d063916f0cd351))
* **introspection:** say how a silenced card comes back ([6e7674f](https://github.com/toa-io/toa/commit/6e7674f88137cfb780f3a7cac1fc67f191f96984))
* **introspection:** separate what the runtime provides ([289c7a3](https://github.com/toa-io/toa/commit/289c7a301dd0ab9c063a5b77b24745983ec79e29))
* **introspection:** show a schema as a shape ([7d9a595](https://github.com/toa-io/toa/commit/7d9a595d86f88846b21bb79aba82bb332b77fbf6))
* **introspection:** the map is the front page ([dbf1b5f](https://github.com/toa-io/toa/commit/dbf1b5fd6d262aa2aa952bbfe2a6be1e44af6302))
* **operations:** let a service claim a path prefix on the host ([02677d1](https://github.com/toa-io/toa/commit/02677d17fcd4222b07c3be458d93bcc496a016a8))


### Performance Improvements

* **introspection:** build a card's details when it shows them ([c10f7c4](https://github.com/toa-io/toa/commit/c10f7c42e51cbef2d3767c36559d846f0e34653a))


### BREAKING CHANGES

* use `toa compose` and `toa call` instead — the first runs the
components, the second calls one of them.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* the extension is predefined, so every Context now declares an
ingress and must say where it lands:

    ingress:
      hosts: [api.example.com]

An application that does not want the page says `introspection: { ui: false }`,
and one that wants no map at all says `introspection: false`. Failing the export
is deliberate: the alternative is quietly not publishing a page that was asked
for.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
* an application whose own extension runs a service on a port
already taken by another — 8000 by the exposition gateway, 8001 by the telemetry
readiness probe — must move it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.261](https://github.com/toa-io/toa/compare/v1.0.0-alpha.260...v1.0.0-alpha.261) (2026-08-26)


### Bug Fixes

* **operations:** include extension pointer variables in --mono ([f8be23d](https://github.com/toa-io/toa/commit/f8be23d2aaf7bbe1b0580101c8bf4d32c3cab99f))





# [1.0.0-alpha.260](https://github.com/toa-io/toa/compare/v1.0.0-alpha.259...v1.0.0-alpha.260) (2026-08-25)


### Bug Fixes

* **amqp:** log lost shards and failed reconnects ([19b7889](https://github.com/toa-io/toa/commit/19b7889076278885f64112824ed3088ddd0363d3))





# [1.0.0-alpha.259](https://github.com/toa-io/toa/compare/v1.0.0-alpha.258...v1.0.0-alpha.259) (2026-08-24)


### Features

* **runtime:** split component RC into preflight and settle ([0d648b3](https://github.com/toa-io/toa/commit/0d648b314e4aac226c254bf01a86affa04b59b34))





# [1.0.0-alpha.258](https://github.com/toa-io/toa/compare/v1.0.0-alpha.257...v1.0.0-alpha.258) (2026-08-24)


### Bug Fixes

* **exposition:** accept federation signature key as PEM ([121fb00](https://github.com/toa-io/toa/commit/121fb00a4e84ec31d65aa1f747f2a22770db9ba1))





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
