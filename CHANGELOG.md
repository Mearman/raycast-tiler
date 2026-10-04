## [1.7.1](https://github.com/Mearman/raycast-tiler/compare/v1.7.0...v1.7.1) (2026-10-04)

### Bug Fixes

* tile on enabling auto tiling even when the window set is unchanged ([7a134c7](https://github.com/Mearman/raycast-tiler/commit/7a134c7f154e39846cafb23fd9c3fd22112c2733))

## [1.7.0](https://github.com/Mearman/raycast-tiler/compare/v1.6.0...v1.7.0) (2026-10-04)

### Features

* add auto tiling that re-tiles the applications of the last tiling ([1edda8a](https://github.com/Mearman/raycast-tiler/commit/1edda8a4bea3ee6a97c2ba0fcaa7f06a3c8a9fcd))

## [1.6.0](https://github.com/Mearman/raycast-tiler/compare/v1.5.0...v1.6.0) (2026-10-04)

### Features

* add commands to swap or insert the focused window by reading-order number ([cf1f554](https://github.com/Mearman/raycast-tiler/commit/cf1f55492604adf5943661f1012c88b0b5c6d3d0))

### Bug Fixes

* title-case the swap by number command ([42f0f1d](https://github.com/Mearman/raycast-tiler/commit/42f0f1d051e939628dda1c8f108d263f6cc692c5))

## [1.5.0](https://github.com/Mearman/raycast-tiler/compare/v1.4.0...v1.5.0) (2026-10-04)

### Features

* default the window order to the previous order ([905597e](https://github.com/Mearman/raycast-tiler/commit/905597ed289e746c0ee0f49c7c5c60dff2b14940))

## [1.4.0](https://github.com/Mearman/raycast-tiler/compare/v1.3.0...v1.4.0) (2026-10-04)

### Features

* add a window order that keeps the previous relative order ([8518792](https://github.com/Mearman/raycast-tiler/commit/85187927c2663cd9350dd4af3d0cab400cc2aa6e))

## [1.3.0](https://github.com/Mearman/raycast-tiler/compare/v1.2.1...v1.3.0) (2026-10-02)

### Features

* keep the current arrangement when most windows are tiled ([4fad80c](https://github.com/Mearman/raycast-tiler/commit/4fad80cf3015aa79afc2628632ec7d120dc2fbb8))
* leave windows already on their target rectangle unmoved ([7a7e8ce](https://github.com/Mearman/raycast-tiler/commit/7a7e8ce5a555a424ab5a1925014cb09e3c1a6f40))
* remember the slot rectangles of the last tiling ([429be56](https://github.com/Mearman/raycast-tiler/commit/429be56807740a697c108b7fba99b22f31e5b9a9))

### Bug Fixes

* close the main window when a tiling command runs ([a6049ca](https://github.com/Mearman/raycast-tiler/commit/a6049cad426d44972b8e486cae588cfb273450a0))

### Documentation

* describe filling open space and skipping settled windows ([43964eb](https://github.com/Mearman/raycast-tiler/commit/43964eb39f11968401d7daf0b60c377f097523b3))

## [1.2.1](https://github.com/Mearman/raycast-tiler/compare/v1.2.0...v1.2.1) (2026-09-29)

### Documentation

* add install instructions ([917779e](https://github.com/Mearman/raycast-tiler/commit/917779edf77f480f6060bbf96f7533927128ed41))
* drop the Raycast Pro requirement and the unverified permission step ([6c0215b](https://github.com/Mearman/raycast-tiler/commit/6c0215b67b558de4d2f23f023843639ce063abfd))
* install with Import Extension and a build, without a dev server ([0d40a4c](https://github.com/Mearman/raycast-tiler/commit/0d40a4c68a2e7560aea316485f79695763b8b03e))
* list every checked constant and merge the prerequisites into Install ([50bee72](https://github.com/Mearman/raycast-tiler/commit/50bee728baaafee409c3e66d9915aa29715905bd))

## [1.2.0](https://github.com/Mearman/raycast-tiler/compare/v1.1.0...v1.2.0) (2026-09-29)

### Features

* animate windows one at a time by default ([1039369](https://github.com/Mearman/raycast-tiler/commit/10393691a3c345e6800dfee988e4b6c4e62e6f84))

## [1.1.0](https://github.com/Mearman/raycast-tiler/compare/v1.0.1...v1.1.0) (2026-09-29)

### Features

* add a configurable grid balance and break grid ties by screen orientation ([92efca0](https://github.com/Mearman/raycast-tiler/commit/92efca0a4932218a79cd7748fb7c6b18233f1c81))
* add a toggle to animate windows one at a time instead of together ([80d1613](https://github.com/Mearman/raycast-tiler/commit/80d16131a26f307d02b5dfe493e311f9e7d96170))

## [1.0.1](https://github.com/Mearman/raycast-tiler/compare/v1.0.0...v1.0.1) (2026-09-29)

### Bug Fixes

* stop turbo replacing the AGENTS.md symlink with its own agent block ([9c5b734](https://github.com/Mearman/raycast-tiler/commit/9c5b73490e975227037c7044d4b404ec003998a9))

### Documentation

* describe the turbo tasks and the scripts that use them ([1bd3b08](https://github.com/Mearman/raycast-tiler/commit/1bd3b08a430e5290c88734889ed4f21d6b7ab082))

### Build System

* run the tasks through turbo with type generation as a dependency ([81ff789](https://github.com/Mearman/raycast-tiler/commit/81ff7895cb37fa4fa7a948409cad299e922a84f4))

## 1.0.0 (2026-09-29)

### Features

* add a Tile with Layout command and disable the dedicated tile commands by default ([14ff80b](https://github.com/Mearman/raycast-tiler/commit/14ff80ba141810bb3a16e6e8a65fc025d52ca3e0))
* add a window order preference and include list reordering ([8dc7591](https://github.com/Mearman/raycast-tiler/commit/8dc75912f77735bb2f6085b39cb40657846a54d7))
* add an optional layout argument to the base tile commands and drop Tile with Layout ([dd721c1](https://github.com/Mearman/raycast-tiler/commit/dd721c13da918c59ba41576ec386ae2b1a3abb95))
* add application include and exclude lists ([760d7ec](https://github.com/Mearman/raycast-tiler/commit/760d7ec4d2fed99de45cb55f4968fdaa5f6adbcc))
* add clock-paced window move animation ([fdb7c2f](https://github.com/Mearman/raycast-tiler/commit/fdb7c2f2ccd737371fae09d1279a73b1bcfa54b4))
* add commands to move and rotate windows within the current layout ([56ae8c5](https://github.com/Mearman/raycast-tiler/commit/56ae8c5ecf3e37316dd96e2ff49d71a4c706b794))
* add commands to move the focused window to the start or end ([25f0ed5](https://github.com/Mearman/raycast-tiler/commit/25f0ed551336d967e03a56b368bc76a3f440d2d1))
* add directional move commands and a Move Window command taking an action argument ([50b7d1b](https://github.com/Mearman/raycast-tiler/commit/50b7d1b287c67647316ede0b28878feabc52e11d))
* add directional swapping of windows by slot position ([9084f07](https://github.com/Mearman/raycast-tiler/commit/9084f07b79419ec8904ba659eb0fd93a7ebfa98b))
* add grid, columns, rows, main-stack and spiral layouts ([b2a90ec](https://github.com/Mearman/raycast-tiler/commit/b2a90ecb926e8294b8920dafd0d7d7706fd7c4fc))
* add nearest-slot assignment using the Hungarian algorithm ([0f64a65](https://github.com/Mearman/raycast-tiler/commit/0f64a658a040eea33f9bba2d8693e57fe5bc3d37))
* add reading, active-first and app-priority window orderings ([f67322c](https://github.com/Mearman/raycast-tiler/commit/f67322cd7cbe49cd44d4f66ffbacc44e5deffc68))
* add separate move and resize duration preferences ([50af1db](https://github.com/Mearman/raycast-tiler/commit/50af1db1332db70b2cf4d78e33c043c00e2e754b))
* add separate toggles for the gap at the screen edge and between windows ([af0f917](https://github.com/Mearman/raycast-tiler/commit/af0f9174a42e5a148817e4109dd3e4b0dd0f71d8))
* add stack layouts and a command for every layout ([9cb567e](https://github.com/Mearman/raycast-tiler/commit/9cb567e9f31d28a14088fd4e25b7af5b7da8ca27))
* add swap and rotate helpers for reordering windows ([92f49df](https://github.com/Mearman/raycast-tiler/commit/92f49dfb5d2bcd10ca5e8111495409d5af2e2ad1))
* add tiling and list management commands ([ca4dfae](https://github.com/Mearman/raycast-tiler/commit/ca4dfaee5da26ea65950b2bfb0816d5916f2a366))
* animate window position and size over independent durations ([46b7a1a](https://github.com/Mearman/raycast-tiler/commit/46b7a1a2e8ce5e872c2008f9980640ff1e7738e0))
* animate windows into place with a configurable duration ([9c54ecf](https://github.com/Mearman/raycast-tiler/commit/9c54ecf1765e9788d29dd1aa92fa3f439029173f))
* assign windows to the layout slots nearest their current positions ([c66fa46](https://github.com/Mearman/raycast-tiler/commit/c66fa46286cf5df38481bed9a2aafab2d39aba0e))
* disable the dedicated move commands by default ([4f8c536](https://github.com/Mearman/raycast-tiler/commit/4f8c536f7443b02e46ceb23b2cc425fca675e4c8))
* enable every layout command by default ([de81d0f](https://github.com/Mearman/raycast-tiler/commit/de81d0f95375c6f13fb7e35f9ffaeec31ba34f12))
* rename commands for clearer root search ([b8b571d](https://github.com/Mearman/raycast-tiler/commit/b8b571d59733872b7b0d0c0b93d2948fe71d6832))
* rename the desktop tiling commands to Tile Windows ([9146c41](https://github.com/Mearman/raycast-tiler/commit/9146c41f44f9a7f7c91986c2554226c7bffeedc6))
* shorten command titles ([91e7b91](https://github.com/Mearman/raycast-tiler/commit/91e7b91feea25a72424dc8814ab66b3c63581ff2))
* support negative gaps and gap units of points, window percent and screen percent ([419d746](https://github.com/Mearman/raycast-tiler/commit/419d7469e6695482930d32c0f0739fa23ec64160))

### Bug Fixes

* choose grid columns by cell shape so nine windows tile 3x3 ([1316b72](https://github.com/Mearman/raycast-tiler/commit/1316b720bd17b51a2818f127ffc02aea7c2efa4f))
* identify the focused window by id because Window.active covers the whole application ([ffa1fc0](https://github.com/Mearman/raycast-tiler/commit/ffa1fc095546c4b9abda6b6474cd8724d5d64fd9))

### Code Refactoring

* remove stack layouts and the stack offset option ([4d3c82c](https://github.com/Mearman/raycast-tiler/commit/4d3c82c1c4340742aad00e4249622b218b5d0bbe))
* satisfy the ExaDev lint rules ([08ca399](https://github.com/Mearman/raycast-tiler/commit/08ca399eb3992546a826dabf5c8d29b367cf1511))

### Documentation

* add README ([231ab8f](https://github.com/Mearman/raycast-tiler/commit/231ab8fefada49f5178e3509671e8103f6d41cc6))
* describe the release process and the changelog writer override ([e205ef6](https://github.com/Mearman/raycast-tiler/commit/e205ef66a727ced552a5f729310298e1566db5fe))
* unify the README with agent instructions and symlink AGENTS.md and CLAUDE.md ([ddafae9](https://github.com/Mearman/raycast-tiler/commit/ddafae94cfe3bc5dbd2add0a049ebad06d658eea))

### Build System

* add semantic-release config with every commit type releasing and in the changelog ([4501400](https://github.com/Mearman/raycast-tiler/commit/450140097b31e035475081e3c789cf49d7880c77))
* run Stryker through the Vitest runner with per-test coverage ([18004b1](https://github.com/Mearman/raycast-tiler/commit/18004b1ba4423422f975fecc8cab217866440c17))

### Continuous Integration

* add checks, semantic-release and a GitHub Packages alias publish ([904bd24](https://github.com/Mearman/raycast-tiler/commit/904bd24aa9b8288aa1d510320d72fd4538e2ea96))
* generate the Raycast types in lint and mutation and run ESLint instead of ray lint ([cc985cc](https://github.com/Mearman/raycast-tiler/commit/cc985cc5b494e9ff619964e0b2acf5b1bb4261c7))

### Miscellaneous Chores

* adopt the ExaDev ESLint config and the commit and test tooling configs ([723f53e](https://github.com/Mearman/raycast-tiler/commit/723f53ea6eff26ec716278d10f0faca8317adf72))
* scaffold Raycast extension ([7a081c3](https://github.com/Mearman/raycast-tiler/commit/7a081c35923690cd5d83833f68566cbf925018af))
* un-ignore AGENTS.md and CLAUDE.md that the global ignore file excludes ([fa83938](https://github.com/Mearman/raycast-tiler/commit/fa83938b07f9279fe1f0653b49f5549bb751a0d1))
