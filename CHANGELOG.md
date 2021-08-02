# Change Log

All notable changes to *configue* will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/)

Up to version [0.7.1] project was know has `hapi-configue`.

## [Unreleased][unreleased]
*Nothing So Far*

## [1.3.6] - 2021-08-02
Pull request [#31]
### Fixed
- Address minor vulns running npm audit fix

## [1.3.5] - 2020-09-13
### Fixed
- Address minor vulns running npm audit fix, and patching codecov

## [1.3.4] - 2020-05-07
### Fixed
- do not include tests . in published package, only src and defaults (and LICENSE, package.json, README and CHANGELOG)

## [1.3.3] - 2020-05-07
Pull request [#21]
### Changed
- updated dependencies and fix vuln
- updated README badges
- added node 14 to tested versions

## [1.3.2] - 2020-03-09
Pull request [#19]
### Changed
- updated dependencies and fix vuln

## [1.3.1] - 2019-11-18
Pull request [#17]
### Changed
- refactor with `protocall` v2 with promise support
- use `fp` flavor of `lodash`
- drop `hapi` as dev dependency. (was used in test for plugin)

## [1.3.0] - 2019-11-02
Pull request [#16]
### Changed
- replace shortstop by protocall
- add `protocall` option to replace `shortstop` on long run

## [1.2.0] - 2019-11-02
### Added
- Improved README with return to top links
### Changed
- upgraded dependencies
- drop @hapi/lab&code for ava
- reorganisation of files
- changed license to MIT
- drop node 8 support

## [1.1.2] - 2018-05-15
### Added
- Improved README with return to top links
## [1.1.1] - 2018-05-13
### Changed
- diverses refactors
  - split main core file
  - introduce helper function
## [1.1.0] - 2018-05-13
### Added
- restore async resolve (hence async promise based hooks)
- add support for shortstop protocols in values
- `resolve` getter in fluent builder
- `withOptions` method on the fluent builder

## [1.0.1] - 2018-05-12
### Changed
- Updated dependencies
## [1.0.0] - 2017-12-18
### Added
- template function
- getObject factory
- model system
- file type deduction
- specifying a config file through `--configue` option
- getAsync function for asynchronous get
- parse options for argv and env
- tranform options for argv and env
- case convert options for argv and env
- separator joint option
### Changed
- automatic resolving by default
- postHook now needs to be synchronous

## [0.16.0] - 2017-04-03
### Added
- getFirst accessor
- getAll accessor

## [0.15.0] - 2017-04-02
### Added
- new overrides steps
- new first hook

## [0.14.1] - 2017-04-02
### Added
- can customize the name of the accessor in the hapi server/request

## [0.14.0] - 2017-04-01
### Added
- hapi plugin registration takes care of the resolve

### Fixed
- hapi plugin decorated function was not working

## [0.13.0] - 2017-04-01
### Added
- fluent builder
- documentation about configuration

## [0.12.0] - 2017-03-31
### Added
- `argv` and `env` configuration

## [0.11.0] - 2017-03-31
### Added
- promises support

## [0.10.1] - 2017-03-31
### Changed
- upgraded dependencies

## [0.10.0] - 2016-02-09
### Added
- can now specify default value to `get`

## [0.9.2] - 2016-02-02
### Changed
- updated dependencies

## [0.9.1] - 2016-02-02
### Changed
- whole api was refactored: `configue` is now usable without hapi
- `configue` is now registerable to hapi by extracting a plugin from the
  instance with `configue.plugin()`

## [0.8.2] - 2016-01-08
### Changed
- Updated Examples

## [0.8.1] - 2016-01-08
### Added
- Setup code quality harness with eslint and Code Climate

### Changed
- Improved README

## [0.8.0] - 2016-01-08
### Changed
- Upgrade package name to *Configue*
- Deprecated previous name with

        npm deprecate hapi-configue "<=v0.7.1" "WARNING: This project has been renamed to configue. Install using configue instead."

## [0.7.1] - 2016-01-08
### Added
- Warning for migration to *Configue*

## [0.7.0] - 2015-12-07
### Added
- defaults options

## [0.6.0] - 2015-12-05
### Changed
- hook can now be asynchronous and must be provided with a callback
### Fixed
- default and overrides hooks in option were not accepted by Joi

## [0.5.0] - 2015-12-03
### Added
- enable full customization with `customWorkflow`
## [0.4.0] - 2015-12-03
### Added
- `.npmignore` for lighter package
## [0.3.3] - 2015-12-03
### Added
- support to configure files with a single path, or array of path (as string)

## [0.3.2] - 2015-12-03
### Added
- new tests
### Fixed
- file were overloading each other
- nconf was persisting between creations

## [0.3.1] - 2015-12-02
### Added
- cucumber integration test
### Fixed
- env variable were ignored

## [0.3.0] - 2015-12-02
### Added
- Joi validation of options
- Hook support

## [0.2.0] - 2015-12-02
### Added
- Minimal "Step" definition
- Usage Example
- More detailed documentation (README+jsdoc)

## [0.1.0] - 2015-12-01
- Initial Release

[#31]: https://github.com/AdrieanKhisbe/configue/pull/31
[#19]: https://github.com/AdrieanKhisbe/configue/pull/19
[#17]: https://github.com/AdrieanKhisbe/configue/pull/17
[#16]: https://github.com/AdrieanKhisbe/configue/pull/16
[unreleased]: https://github.com/AdrieanKhisbe/configue/compare/v1.3.6...HEAD
[1.3.6]: https://github.com/AdrieanKhisbe/configue/compare/v1.3.5...v1.3.6
[1.3.5]: https://github.com/AdrieanKhisbe/configue/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/AdrieanKhisbe/configue/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/AdrieanKhisbe/configue/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/AdrieanKhisbe/configue/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/AdrieanKhisbe/configue/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/AdrieanKhisbe/configue/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/AdrieanKhisbe/configue/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/AdrieanKhisbe/configue/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/AdrieanKhisbe/configue/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/AdrieanKhisbe/configue/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/AdrieanKhisbe/configue/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/AdrieanKhisbe/configue/compare/v0.16.0...v1.0.0
[0.16.0]: https://github.com/AdrieanKhisbe/configue/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/AdrieanKhisbe/configue/compare/v0.14.1...v0.15.0
[0.14.1]: https://github.com/AdrieanKhisbe/configue/compare/v0.14.0...v0.14.1
[0.14.0]: https://github.com/AdrieanKhisbe/configue/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/AdrieanKhisbe/configue/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/AdrieanKhisbe/configue/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/AdrieanKhisbe/configue/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/AdrieanKhisbe/configue/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/AdrieanKhisbe/configue/compare/v0.9.2...v0.10.0
[0.9.2]: https://github.com/AdrieanKhisbe/configue/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/AdrieanKhisbe/configue/compare/v0.8.2...v0.9.1
[0.8.2]: https://github.com/AdrieanKhisbe/configue/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/AdrieanKhisbe/configue/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/AdrieanKhisbe/configue/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/AdrieanKhisbe/hapi-configue/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/AdrieanKhisbe/hapi-configue/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/AdrieanKhisbe/hapi-configue/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/AdrieanKhisbe/hapi-configue/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/AdrieanKhisbe/hapi-configue/compare/v0.3.3...v0.4.0
[0.3.3]: https://github.com/AdrieanKhisbe/hapi-configue/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/AdrieanKhisbe/hapi-configue/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/AdrieanKhisbe/hapi-configue/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/AdrieanKhisbe/hapi-configue/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AdrieanKhisbe/hapi-configue/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/AdrieanKhisbe/hapi-configue/compare/e482070....v0.1.0
