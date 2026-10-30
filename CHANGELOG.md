# Changelog

## [Unreleased] - SCRUM-2
### Fixed
- --out equal to --template is rejected inside run() by real path (symlinks and different spellings); template is never modified.
- A leading UTF-8 BOM in package.json is ignored.
- A non-string version in dependencies or devDependencies makes the whole field Not Found.
- A repeated placeholder counts once in the "N / M placeholders found" summary and is replaced everywhere.
### Changed
- CI triggers on pushes to main and master.
### Known limitations
- Hard links to the template are not detected; dependencies given as an array render oddly (0@a).
