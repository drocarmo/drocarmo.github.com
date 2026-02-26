# AGENTS.md

## Cursor Cloud specific instructions

This is a Jekyll 4.3.3 static portfolio site. Ruby 3.2+, Bundler, and `build-essential` must be installed at the system level before gems can be installed.

### Key commands

| Task | Command |
|------|---------|
| Install gems | `bundle install` |
| Build site | `bundle exec jekyll build --trace` |
| Dev server | `bundle exec jekyll serve --host 0.0.0.0 --port 4000 --trace` |
| Dev server + Sass watcher | `bundle exec rake` |
| Lint SCSS | `bundle exec scss-lint css/sass/` |

### Notes

- Gems are vendored into `_vendor/` (configured in `.bundle/config`).
- The `sass` gem (Ruby Sass) is EOL but still used by `scss_lint`. The site itself compiles SCSS via `jekyll-sass-converter` / `sass-embedded`.
- `scss_lint` reports many pre-existing warnings/errors in the codebase — these are expected.
- There are no automated test suites; testing is manual via the dev server.
- The Rakefile's default task spawns both `jekyll serve` and `sass --watch` in parallel. For most dev work, running `bundle exec jekyll serve` alone is sufficient since Jekyll's built-in Sass converter handles SCSS compilation.
- The site runs on port 4000 by default.
